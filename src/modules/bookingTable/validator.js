const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة بيانات حجز طاولة جديدة
const createBookingTableValidator = [
    // A booking names its table either by tableId (managed tables) or by the area value (older clients, chatbot)
    check("area")
        .if((value, { req }) => !req.body.tableId)
        .notEmpty().withMessage("منطقة الجلوس مطلوبة (Step 1)")
        .isString().trim().isLength({ min: 1, max: 120 }).withMessage("المنطقة المختارة غير صحيحة"),

    check("date")
        .notEmpty().withMessage("تاريخ الحجز مطلوب")
        .isISO8601().withMessage("صيغة تاريخ الحجز غير صحيحة (مثال: 2026-10-24)"),

    check("time")
        .notEmpty().withMessage("موعد الحجز مطلوب (مثل: 6:00 PM)"),

    check("numberOfPerson")
        .notEmpty().withMessage("عدد الأفراد / المقاعد مطلوب")
        .isInt({ min: 1 }).withMessage("عدد الأفراد يجب أن يكون 1 على الأقل"),

    check("adults")
        .optional({ values: "null" })
        .isInt({ min: 0 }).withMessage("عدد البالغين غير صحيح"),

    check("children")
        .optional({ values: "null" })
        .isInt({ min: 0 }).withMessage("عدد الأطفال غير صحيح"),

    check("highChair")
        .optional({ values: "null" })
        .isBoolean().withMessage("طلب كرسي الأطفال غير صحيح"),

    check("guest")
        .optional()
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    check("phone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("رقم الهاتف يجب أن يكون رقماً مصرياً صالحاً (11 رقم)"),

    check("guestPhone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("رقم الهاتف يجب أن يكون رقماً مصرياً صالحاً (11 رقم)"),

    body()
        .custom((value, { req }) => {
            if (!req.body.guest && !req.body.guestPhone && !req.body.phone) {
                throw new Error("يجب إدخال معرف الضيف أو رقم الهاتف لتأكيد الحجز");
            }
            return true;
        }),

    validatorMiddleware
];

// @desc التحقق من صحة جلب حجز طاولة بالمعرف
const getBookingTableValidator = [
    check("id")
        .isMongoId().withMessage("معرف حجز الطاولة غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة جلب حجز طاولة بالكود (TB-XXXXXX)
const getBookingTableByCodeValidator = [
    check("code")
        .notEmpty().withMessage("رمز الحجز مطلوب (مثل TB-123456)"),

    validatorMiddleware
];

// @desc التحقق من صحة جلب حجوزات ضيف محدد
const getBookingsByGuestValidator = [
    check("guestId")
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تعديل حجز طاولة
const updateBookingTableValidator = [
    check("id")
        .isMongoId().withMessage("معرف حجز الطاولة غير صالح"),

    check("area")
        .optional()
        .isString().trim().isLength({ min: 1, max: 120 }).withMessage("المنطقة المختارة غير صحيحة"),

    check("numberOfPerson")
        .optional()
        .isInt({ min: 1 }).withMessage("عدد الأفراد يجب أن يكون 1 على الأقل"),

    validatorMiddleware
];

// @desc التحقق من صحة تحديث حالة الحجز (pending, confirmed, cancelled)
const updateBookingStatusValidator = [
    check("id")
        .isMongoId().withMessage("معرف حجز الطاولة غير صالح"),

    check("status")
        .notEmpty().withMessage("حالة الحجز مطلوبة")
        .isIn(["pending", "confirmed", "cancelled", "completed", "rejected"])
        .withMessage("حالة الحجز يجب أن تكون إحدى القيم التالية: (pending, confirmed, cancelled, completed, rejected)"),

    check("rejectionReason")
        .optional({ values: "null" })
        .isString().trim().isLength({ max: 300 }).withMessage("سبب الرفض طويل جداً (300 حرف كحد أقصى)"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف / إلغاء حجز طاولة
const deleteBookingTableValidator = [
    check("id")
        .isMongoId().withMessage("معرف حجز الطاولة غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة استعلام توفر الطاولات
const checkAvailabilityValidator = [
    check("date")
        .notEmpty().withMessage("تاريخ الفحص مطلوب (مثال: ?date=2026-10-24)"),

    check("area")
        .optional()
        .isString().trim().isLength({ min: 1, max: 120 }).withMessage("المنطقة المختارة غير صحيحة"),

    validatorMiddleware
];

module.exports = {
    createBookingTableValidator,
    getBookingTableValidator,
    getBookingTableByCodeValidator,
    getBookingsByGuestValidator,
    updateBookingTableValidator,
    updateBookingStatusValidator,
    deleteBookingTableValidator,
    checkAvailabilityValidator
};
