const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// Helper middleware to parse JSON string fields if sent as multipart/form-data
const parseFormDataJsonFields = (req, res, next) => {
    if (typeof req.body.tickets === "string") {
        try {
            req.body.tickets = JSON.parse(req.body.tickets);
        } catch (e) {}
    }
    if (typeof req.body.packages === "string") {
        try {
            req.body.packages = JSON.parse(req.body.packages);
        } catch (e) {}
    }
    next();
};

// @desc التحقق من صحة بيانات إنشاء عملية شراء تذاكر/باقات
const createBuyingValidator = [
    parseFormDataJsonFields,

    check("guest")
        .optional()
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    check("guestPhone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("رقم هاتف الضيف يجب أن يكون مصرياً صالحاً (11 رقم)"),

    check("senderAccount")
        .optional()
        .isString().withMessage("حساب أو رقم المحول منه يجب أن يكون نصياً")
        .trim(),

    check("tickets")
        .optional()
        .isArray().withMessage("بيانات التذاكر يجب أن تكون في شكل مصفوفة"),

    check("tickets.*.ticket")
        .if(check("tickets").exists())
        .notEmpty().withMessage("معرف التذكرة مطلوب لكل عنصر تذكرة"),

    check("tickets.*.quantity")
        .if(check("tickets").exists())
        .optional()
        .isInt({ min: 1 }).withMessage("عدد التذاكر يجب أن يكون 1 على الأقل"),

    check("packages")
        .optional()
        .isArray().withMessage("بيانات الباقات يجب أن تكون في شكل مصفوفة"),

    check("packages.*.package")
        .if(check("packages").exists())
        .notEmpty().withMessage("معرف الباقة مطلوب لكل عنصر باقة"),

    check("packages.*.quantity")
        .if(check("packages").exists())
        .optional()
        .isInt({ min: 1 }).withMessage("عدد الباقات يجب أن يكون 1 على الأقل"),

    body()
        .custom((value, { req }) => {
            const hasTickets = Array.isArray(req.body.tickets) && req.body.tickets.length > 0;
            const hasPackages = Array.isArray(req.body.packages) && req.body.packages.length > 0;
            if (!hasTickets && !hasPackages) {
                throw new Error("يجب اختيار تذكرة واحدة على الأقل أو باقة واحدة لإتمام عملية الشراء");
            }
            return true;
        }),

    check("paymentMethod")
        .optional()
        .isIn(["cash", "card", "instapay", "vodafone_cash", "points", "money"])
        .withMessage("طريقة الدفع غير صحيحة، الخيارات المتاحة: (cash, card, instapay, vodafone_cash, points, money)"),

    check("paymentStatus")
        .optional()
        .isIn(["pending", "pending_verification", "paid", "failed", "refunded"])
        .withMessage("حالة الدفع غير صحيحة، الخيارات المتاحة: (pending, pending_verification, paid, failed, refunded)"),

    validatorMiddleware
];

// @desc التحقق من صحة جلب عملية شراء بالمعرف
const getBuyingValidator = [
    check("id")
        .isMongoId().withMessage("معرف عملية الشراء غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة كود الحجز (PZ-XXXXXX)
const getBuyingByCodeValidator = [
    check("code")
        .notEmpty().withMessage("رمز الحجز مطلوب (مثل PZ-123456)"),

    validatorMiddleware
];

// @desc التحقق من صحة جلب مشتريات ضيف محدد
const getBuyingsByGuestValidator = [
    check("guestId")
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تفعيل وتأكيد دخول التذكرة (Redeem)
const redeemBuyingValidator = [
    check()
        .custom((value, { req }) => {
            const identifier = req.params.id || req.params.code;
            if (!identifier) {
                throw new Error("رمز أو معرف التذكرة مطلوب لإتمام الدخول");
            }
            return true;
        }),

    validatorMiddleware
];

// @desc التحقق من صحة تحديث حالة الحجز والدفع
const updateBuyingStatusValidator = [
    check("id")
        .isMongoId().withMessage("معرف عملية الشراء غير صالح"),

    check("status")
        .optional()
        .isIn(["pending", "confirmed", "completed", "cancelled"])
        .withMessage("حالة الطلب غير صحيحة، الخيارات: (pending, confirmed, completed, cancelled)"),

    check("paymentStatus")
        .optional()
        .isIn(["pending", "pending_verification", "paid", "failed", "refunded"])
        .withMessage("حالة الدفع غير صحيحة، الخيارات: (pending, pending_verification, paid, failed, refunded)"),

    validatorMiddleware
];

// @desc التحقق من صحة مراجعة واعتماد الإيصال اليدوي (Admin)
const verifyPaymentValidator = [
    check("id")
        .isMongoId().withMessage("معرف عملية الشراء غير صالح"),

    check("action")
        .notEmpty().withMessage("إجراء المراجعة مطلوب (approve أو reject)")
        .isIn(["approve", "reject"]).withMessage("الإجراء يجب أن يكون إما approve أو reject"),

    check("rejectionReason")
        .optional()
        .isString().withMessage("سبب الرفض يجب أن يكون نصاً")
        .trim(),

    validatorMiddleware
];

// @desc التحقق من تأكيد استلام النقدية على البوابة
const markCashCollectedValidator = [
    check("id")
        .isMongoId().withMessage("معرف عملية الشراء غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف عملية الشراء
const deleteBuyingValidator = [
    check("id")
        .isMongoId().withMessage("معرف عملية الشراء غير صالح"),

    validatorMiddleware
];

module.exports = {
    createBuyingValidator,
    getBuyingValidator,
    getBuyingByCodeValidator,
    getBuyingsByGuestValidator,
    redeemBuyingValidator,
    updateBuyingStatusValidator,
    verifyPaymentValidator,
    markCashCollectedValidator,
    deleteBuyingValidator
};
