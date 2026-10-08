const { verifyToken } = require("../utils/token");
const guestModel = require("../modules/guests/model");

// @desc Middleware to protect routes for authenticated guests
const protectGuest = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "يرجى تسجيل الدخول للوصول إلى هذا المسار (رمز التحقق غير موجود)"
            });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "جلسة العمل غير صالحة أو منتهية، يرجى تسجيل الدخول مجدداً"
            });
        }

        const currentGuest = await guestModel.findById(decoded.id);
        if (!currentGuest) {
            return res.status(401).json({
                success: false,
                message: "المستخدم صاحب هذا الرمز لم يعد موجوداً"
            });
        }

        req.guest = currentGuest;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { protectGuest };
