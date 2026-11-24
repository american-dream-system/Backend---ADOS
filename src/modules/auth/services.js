const crypto = require("crypto");
const guestModel = require("../guests/model");
const LoyaltySettings = require("../loyalty/model");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../utils/sendEmail");
const { createToken, createRefreshToken, verifyRefreshToken } = require("../../utils/token");
const { normalizePhone, PHONE_RE, NAME_MIN, PASSWORD_MIN, MSG } = require("../../utils/accountRules");

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

// Compared against when no account matches, so an unknown account costs the same time as a wrong password
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("no-such-account", 12);

// One answer for "unknown account" and "wrong password": the response never says which one it was
const INVALID_LOGIN_MESSAGE = "بيانات تسجيل الدخول غير صحيحة، يرجى التأكد من رقم الهاتف أو كلمة المرور";

// @desc تسجيل حساب جديد
// @route POST /api/auth/signup
// @access Public
const signup = async (req, res, next) => {
    try {
        const { name, email, phone, password, age, gender, children } = req.body;

        let initialPoints = 0;
        try {
            const settings = await LoyaltySettings.getSettings();
            if (settings && settings.isEnabled) {
                initialPoints = Number(settings.welcomeBonusPoints) || 0;
            }
        } catch (e) {}

        const newGuest = await guestModel.create({
            name,
            email: email ? email.toLowerCase().trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            password,
            age,
            gender,
            children: children || [],
            points: initialPoints
        });

        // Generate JWT Access & Refresh Tokens
        const token = createToken({ id: newGuest._id });
        const refreshToken = createRefreshToken({ id: newGuest._id });

        newGuest.refreshToken = refreshToken;
        await newGuest.save({ validateBeforeSave: false });

        res.status(201).json({
            success: true,
            message: "تم إنشاء الحساب بنجاح",
            token,
            refreshToken,
            data: newGuest
        });
    } catch (error) {
        next(error);
    }
};

// @desc تسجيل الدخول
// @route POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
    try {
        const { phone, identifier, email, password } = req.body;
        const loginId = (phone || identifier || email || "").trim();

        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: "يرجى إدخال رقم الهاتف وكلمة المرور"
            });
        }

        // Clean phone formatting if entered with +20 or spaces
        let normalizedPhone = loginId.replace(/\s+/g, "");
        if (normalizedPhone.startsWith("+20")) {
            normalizedPhone = "0" + normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("20") && normalizedPhone.length === 12) {
            normalizedPhone = "0" + normalizedPhone.substring(2);
        }

        // Find guest by phone (primary) or email
        const guest = await guestModel.findOne({
            $or: [
                { phone: loginId },
                { phone: normalizedPhone },
                { email: loginId.toLowerCase() }
            ]
        });

        // Verify password (against a dummy hash when there is no such account)
        let isMatch = false;
        if (guest) {
            isMatch = await guest.comparePassword(password);
        } else {
            await bcrypt.compare(String(password), DUMMY_PASSWORD_HASH);
        }
        if (!guest || !isMatch) {
            return res.status(401).json({
                success: false,
                message: INVALID_LOGIN_MESSAGE
            });
        }

        // Generate tokens
        const token = createToken({ id: guest._id });
        const refreshToken = createRefreshToken({ id: guest._id });

        guest.refreshToken = refreshToken;
        await guest.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "تم تسجيل الدخول بنجاح",
            token,
            refreshToken,
            data: guest
        });
    } catch (error) {
        next(error);
    }
};

// @desc طلب استعادة كلمة المرور وإرسال كود التحقق
// @route POST /api/auth/forgot-password or /api/auth/forgetPassword
// @access Public
const forgetPassword = async (req, res, next) => {
    try {
        const { email, phone, identifier } = req.body;
        const lookup = (phone || identifier || email || "").trim();

        let normalizedPhone = lookup.replace(/\s+/g, "");
        if (normalizedPhone.startsWith("+20")) {
            normalizedPhone = "0" + normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("20") && normalizedPhone.length === 12) {
            normalizedPhone = "0" + normalizedPhone.substring(2);
        }

        const guest = await guestModel.findOne({
            $or: [
                { phone: lookup },
                { phone: normalizedPhone },
                { email: lookup.toLowerCase() }
            ]
        });

        // The same answer whether or not the account exists, so this endpoint cannot be used to find accounts
        const genericReply = () => res.status(200).json({
            success: true,
            message: "إذا كان الحساب مسجلاً لدينا، فقد تم إرسال كود التحقق إلى بريده الإلكتروني"
        });

        if (!guest) {
            return genericReply();
        }

        // Generate 6-digit verification code with a cryptographically secure generator
        const resetCode = crypto.randomInt(100000, 1000000).toString();

        // Hash code and store in DB with 10 minutes expiry
        const hashedResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");
        guest.passwordResetCode = hashedResetCode;
        guest.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        guest.passwordResetVerified = false;
        await guest.save({ validateBeforeSave: false });

        // The code is never logged or returned: it only goes out by email (not awaited, so the reply
        // takes the same time for every account)
        if (guest.email) {
            try {
                Promise.resolve(sendEmail({
                    to: guest.email,
                    subject: "كود إعادة تعيين كلمة المرور - American Dream",
                    html: `
                        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                            <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 8px;">American Dream</h2>
                            <h3 style="color: #2563eb; text-align: center; margin-top: 0;">إعادة تعيين كلمة المرور</h3>
                            <p style="color: #334155; font-size: 15px;">مرحباً <b>${guest.name}</b>،</p>
                            <p style="color: #334155; font-size: 15px;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في أمريكان دريم.</p>
                            <p style="color: #334155; font-size: 15px;">كود التحقق الخاص بك هو:</p>
                            <div style="text-align: center; margin: 24px 0;">
                                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; background: linear-gradient(135deg, #1d4ed8, #3b82f6); padding: 12px 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(37,99,235,0.25);">${resetCode}</span>
                            </div>
                            <p style="color: #64748b; font-size: 13px; text-align: center;">صلاحية هذا الكود 10 دقائق فقط من وقت الإرسال.</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                            <p style="color: #94a3b8; font-size: 12px; text-align: center;">إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.</p>
                        </div>
                    `
                })).catch((emailError) => console.error("Email send error:", emailError.message));
            } catch (emailError) {
                console.error("Email send error:", emailError.message);
            }
        }

        return genericReply();
    } catch (error) {
        next(error);
    }
};

// @desc التحقق من صحة كود إعادة تعيين كلمة المرور
// @route POST /api/auth/verify-code or /api/auth/verifyResetCode
// @access Public
const verifyResetCode = async (req, res, next) => {
    try {
        const { email, phone, identifier, resetCode } = req.body;
        const lookup = (phone || identifier || email || "").trim();

        let normalizedPhone = lookup.replace(/\s+/g, "");
        if (normalizedPhone.startsWith("+20")) {
            normalizedPhone = "0" + normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("20") && normalizedPhone.length === 12) {
            normalizedPhone = "0" + normalizedPhone.substring(2);
        }

        const hashedResetCode = crypto
            .createHash("sha256")
            .update((resetCode || "").trim())
            .digest("hex");

        const guest = await guestModel.findOne({
            $or: [
                { phone: lookup },
                { phone: normalizedPhone },
                { email: lookup.toLowerCase() }
            ],
            passwordResetCode: hashedResetCode,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!guest) {
            return res.status(400).json({
                success: false,
                message: "كود التحقق غير صالح أو انتهت صلاحيته"
            });
        }

        // Mark code as verified
        guest.passwordResetVerified = true;
        await guest.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "تم التحقق من كود إعادة التعيين بنجاح، يمكنك الآن كتابة كلمة مرور جديدة"
        });
    } catch (error) {
        next(error);
    }
};

// @desc تعيين كلمة المرور الجديدة
// @route POST /api/auth/reset-password or /api/auth/resetPassword
// @access Public
const resetPassword = async (req, res, next) => {
    try {
        const { email, phone, identifier, newPassword } = req.body;
        const lookup = (phone || identifier || email || "").trim();

        let normalizedPhone = lookup.replace(/\s+/g, "");
        if (normalizedPhone.startsWith("+20")) {
            normalizedPhone = "0" + normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("20") && normalizedPhone.length === 12) {
            normalizedPhone = "0" + normalizedPhone.substring(2);
        }

        const guest = await guestModel.findOne({
            $or: [
                { phone: lookup },
                { phone: normalizedPhone },
                { email: lookup.toLowerCase() }
            ],
            passwordResetVerified: true
        });

        if (!guest) {
            return res.status(400).json({
                success: false,
                message: "لم يتم التحقق من كود إعادة التعيين أو انتهت صلاحية الجلسة"
            });
        }

        // Update password and clear reset fields
        guest.password = newPassword;
        guest.passwordResetCode = undefined;
        guest.passwordResetExpires = undefined;
        guest.passwordResetVerified = undefined;

        // Generate fresh tokens
        const token = createToken({ id: guest._id });
        const refreshToken = createRefreshToken({ id: guest._id });

        guest.refreshToken = refreshToken;
        await guest.save();

        res.status(200).json({
            success: true,
            message: "تم إعادة تعيين كلمة المرور بنجاح",
            token,
            refreshToken,
            data: guest
        });
    } catch (error) {
        next(error);
    }
};

// @desc تجديد رمز الوصول (Refresh Token)
// @route POST /api/auth/refresh-token or /api/auth/refreshToken
// @access Public
const refreshTokenService = async (req, res, next) => {
    try {
        const tokenFromReq = req.body.refreshToken || req.headers["x-refresh-token"];

        if (!tokenFromReq) {
            return res.status(400).json({
                success: false,
                message: "رمز التحديث (refresh token) مطلوب"
            });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(tokenFromReq);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "رمز التحديث غير صالح أو منتهي الصلاحية، يرجى تسجيل الدخول مجدداً"
            });
        }

        const guest = await guestModel.findById(decoded.id);
        if (!guest || guest.refreshToken !== tokenFromReq) {
            return res.status(401).json({
                success: false,
                message: "رمز التحديث غير مطابق أو الحساب غير موجود"
            });
        }

        // Generate new token & new rotated refresh token
        const newAccessToken = createToken({ id: guest._id });
        const newRefreshToken = createRefreshToken({ id: guest._id });

        guest.refreshToken = newRefreshToken;
        await guest.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "تم تجديد رمز الوصول بنجاح",
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc جلب بيانات الحساب الحالي المسجل
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: req.guest
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// OWN ACCOUNT (the signed-in guest, identified by the token alone)
// ==========================================

const fail = (res, code, message) => res.status(code).json({ success: false, message });

// @desc Edit personal information: exactly what sign-up collects (name, phone, age, gender)
// @route PUT /api/auth/me      body: { name, phone, age, gender, currentPassword }
// @access Private. The account is req.guest (from the token); no id is read from the request.
// Changing the phone number, a login identifier, needs the current password and a number no other account uses.
const updateMe = async (req, res, next) => {
    try {
        const b = req.body || {};
        const me = req.guest;
        const update = {};

        if (b.name !== undefined) {
            const name = typeof b.name === "string" ? b.name.trim() : "";
            if (name.length < NAME_MIN) return fail(res, 400, MSG.name);
            update.name = name;
        }
        if (b.age !== undefined) {
            const age = typeof b.age === "string" || typeof b.age === "number" ? String(b.age).trim() : "";
            if (!age) return fail(res, 400, MSG.age);
            update.age = age;
        }
        if (b.gender !== undefined) {
            if (!["male", "female"].includes(b.gender)) return fail(res, 400, MSG.gender);
            update.gender = b.gender;
        }
        let phoneChanged = false;
        if (b.phone !== undefined) {
            const phone = normalizePhone(b.phone);
            if (!PHONE_RE.test(phone)) return fail(res, 400, MSG.phone);
            if (phone !== me.phone) { phoneChanged = true; update.phone = phone; }
        }
        if (Object.keys(update).length === 0) return fail(res, 400, MSG.nothing);

        if (phoneChanged) {
            if (typeof b.currentPassword !== "string" || !b.currentPassword) return fail(res, 400, MSG.currentRequired);
            if (!(await me.comparePassword(b.currentPassword))) return fail(res, 403, MSG.currentWrong);
            const taken = await guestModel.findOne({ phone: update.phone, _id: { $ne: me._id } }).select("_id").lean();
            if (taken) return fail(res, 409, MSG.phoneTaken);
        }

        try {
            await guestModel.updateOne({ _id: me._id }, { $set: update });
        } catch (err) {
            if (err && err.code === 11000) return fail(res, 409, MSG.phoneTaken); // lost a race with another account
            throw err;
        }
        const fresh = await guestModel.findById(me._id);
        res.status(200).json({ success: true, message: "تم حفظ البيانات / Saved", data: fresh });
    } catch (error) {
        next(error);
    }
};

// @desc Change password
// @route POST /api/auth/change-password   body: { currentPassword, newPassword, newPasswordConfirm }
// @access Private (token only). Stored with the same hashing as sign-up (the model's pre-save hook). Other sessions
// end: passwordChangedAt makes every earlier access token invalid (see protectGuest) and a new refresh token replaces
// the old one; this device gets fresh tokens. A password is never logged or returned.
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, newPasswordConfirm } = req.body || {};
        if (typeof currentPassword !== "string" || !currentPassword) return fail(res, 400, MSG.currentRequired);
        if (typeof newPassword !== "string" || newPassword.length < PASSWORD_MIN) return fail(res, 400, MSG.passwordShort);
        if (newPasswordConfirm !== undefined && newPasswordConfirm !== newPassword) return fail(res, 400, MSG.passwordMismatch);

        const me = await guestModel.findById(req.guest._id);
        if (!me) return fail(res, 401, MSG.currentWrong);
        if (!(await me.comparePassword(currentPassword))) return fail(res, 403, MSG.currentWrong);
        if (newPassword === currentPassword || (await me.comparePassword(newPassword))) return fail(res, 400, MSG.passwordSame);

        me.password = newPassword; // hashed by the pre-save hook, as at sign-up
        me.passwordChangedAt = new Date();
        const token = createToken({ id: me._id });
        const refreshToken = createRefreshToken({ id: me._id });
        me.refreshToken = refreshToken;
        await me.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: "تم تغيير كلمة المرور / Password changed", token, refreshToken });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateMe,
    changePassword,
    signup,
    login,
    forgetPassword,
    verifyResetCode,
    resetPassword,
    refreshTokenService,
    getMe
};
