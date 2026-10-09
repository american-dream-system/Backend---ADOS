const crypto = require("crypto");
const guestModel = require("../guests/model");
const sendEmail = require("../../utils/sendEmail");
const { createToken, createRefreshToken, verifyRefreshToken } = require("../../utils/token");

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

// @desc تسجيل حساب جديد
// @route POST /api/auth/signup
// @access Public
const signup = async (req, res, next) => {
    try {
        const { name, email, phone, password, age, gender, children } = req.body;

        const newGuest = await guestModel.create({
            name,
            email: email ? email.toLowerCase().trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            password,
            age: age || "25",
            gender: gender || "male",
            children: children || []
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

        if (!guest) {
            return res.status(401).json({
                success: false,
                message: "بيانات تسجيل الدخول غير صحيحة، يرجى التأكد من رقم الهاتف أو كلمة المرور"
            });
        }

        // Verify password
        const isMatch = await guest.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "كلمة المرور غير صحيحة"
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

        if (!guest) {
            return res.status(404).json({
                success: false,
                message: "لا يوجد حساب مسجل برقم الهاتف أو البريد الإلكتروني المدخل"
            });
        }

        // Generate 6-digit verification code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash code and store in DB with 10 minutes expiry
        const hashedResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");
        guest.passwordResetCode = hashedResetCode;
        guest.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        guest.passwordResetVerified = false;
        await guest.save({ validateBeforeSave: false });

        console.log(`🔐 Password Reset Code for [${guest.phone || guest.email}]: ${resetCode}`);

        // Send email via sendEmail if email exists
        if (guest.email) {
            try {
                await sendEmail({
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
                });
            } catch (emailError) {
                console.error("Email send error:", emailError.message);
            }
        }

        res.status(200).json({
            success: true,
            message: guest.email 
                ? "تم إرسال كود التحقق بنجاح إلى بريدك الإلكتروني"
                : "تم إنشاء كود التحقق بنجاح",
            resetCode: process.env.NODE_ENV === "development" ? resetCode : undefined
        });
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

module.exports = {
    signup,
    login,
    forgetPassword,
    verifyResetCode,
    resetPassword,
    refreshTokenService,
    getMe
};
