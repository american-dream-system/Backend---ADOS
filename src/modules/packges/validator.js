const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة بيانات إنشاء باقة جديدة
const createPackageValidator = [
    check("title")
        .notEmpty().withMessage("عنوان الباقة مطلوب")
        .isLength({ min: 2 }).withMessage("يجب ألا يقل عنوان الباقة عن حرفين"),

    check("price")
        .notEmpty().withMessage("سعر الباقة مطلوب")
        .isNumeric().withMessage("سعر الباقة يجب أن يكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("سعر الباقة لا يمكن أن يكون سالباً");
            return true;
        }),

    check("priceAfterDiscount")
        .notEmpty().withMessage("السعر بعد الخصم مطلوب")
        .isNumeric().withMessage("السعر بعد الخصم يجب أن يكون رقماً")
        .custom((val, { req }) => {
            if (val < 0) throw new Error("السعر بعد الخصم لا يمكن أن يكون سالباً");
            if (req.body.price && val > req.body.price) {
                throw new Error("السعر بعد الخصم يجب أن يكون أقل من أو يساوي السعر الأساسي");
            }
            return true;
        }),

    check("pointsGets")
        .notEmpty().withMessage("نقاط الولاء المكتسبة مطلوبة")
        .isNumeric().withMessage("نقاط الولاء يجب أن تكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("نقاط الولاء لا يمكن أن تكون سالبة");
            return true;
        }),

    check("description")
        .notEmpty().withMessage("وصف الباقة مطلوب"),

    check("image")
        .custom((val, { req }) => {
            if (!req.file && !req.body.image) {
                throw new Error("صورة الباقة مطلوبة (عبر رفع ملف أو كتابة رابط/اسم الصورة)");
            }
            return true;
        }),

    validatorMiddleware
];

// @desc التحقق من صحة جلب باقة بالمعرف
const getPackageValidator = [
    check("id")
        .isMongoId().withMessage("معرف الباقة غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تعديل باقة
const updatePackageValidator = [
    check("id")
        .isMongoId().withMessage("معرف الباقة غير صالح"),

    check("price")
        .optional()
        .isNumeric().withMessage("سعر الباقة يجب أن يكون رقماً"),

    check("priceAfterDiscount")
        .optional()
        .isNumeric().withMessage("السعر بعد الخصم يجب أن يكون رقماً"),

    check("pointsGets")
        .optional()
        .isNumeric().withMessage("نقاط الولاء يجب أن تكون رقماً"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف باقة
const deletePackageValidator = [
    check("id")
        .isMongoId().withMessage("معرف الباقة غير صالح"),

    validatorMiddleware
];

module.exports = {
    createPackageValidator,
    getPackageValidator,
    updatePackageValidator,
    deletePackageValidator
};
