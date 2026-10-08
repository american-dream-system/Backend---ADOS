const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");
const guestModel = require("./model");

// @desc التحقق من صحة بيانات إنشاء ضيف جديد
const createGuestValidator = [
    check("name")
        .notEmpty().withMessage("اسم الضيف مطلوب")
        .isLength({ min: 3 }).withMessage("يجب ألا يقل اسم الضيف عن 3 أحرف"),

    check("phone")
        .notEmpty().withMessage("رقم الهاتف مطلوب")
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("يجب إدخال رقم هاتف مصري صالح (11 رقم)")
        .custom(async (val) => {
            const existing = await guestModel.findOne({ phone: val.trim() });
            if (existing) {
                throw new Error("رقم الهاتف مسجل بالفعل لضيف آخر");
            }
            return true;
        }),

    check("age")
        .notEmpty().withMessage("العمر مطلوب"),

    check("gender")
        .notEmpty().withMessage("النوع مطلوب")
        .isIn(["male", "female"]).withMessage("النوع يجب أن يكون إما ذكر (male) أو أنثى (female)"),

    check("children")
        .optional()
        .isArray().withMessage("بيانات الأطفال يجب أن تكون في شكل قائمة (مصفوفة)"),

    check("children.*.name")
        .optional()
        .notEmpty().withMessage("اسم الطفل مطلوب"),

    check("children.*.age")
        .optional()
        .notEmpty().withMessage("عمر الطفل مطلوب"),

    check("children.*.gender")
        .optional()
        .isIn(["male", "female"]).withMessage("نوع الطفل يجب أن يكون إما ذكر (male) أو أنثى (female)"),

    validatorMiddleware
];

// @desc التحقق من صحة جلب ضيف بواسطة المعرف
const getGuestValidator = [
    check("id")
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تعديل بيانات الضيف
const updateGuestValidator = [
    check("id")
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    check("name")
        .optional()
        .isLength({ min: 3 }).withMessage("يجب ألا يقل اسم الضيف عن 3 أحرف"),

    check("phone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("يجب إدخال رقم هاتف مصري صالح (11 رقم)"),

    check("gender")
        .optional()
        .isIn(["male", "female"]).withMessage("النوع يجب أن يكون إما ذكر (male) أو أنثى (female)"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف ضيف
const deleteGuestValidator = [
    check("id")
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    validatorMiddleware
];

module.exports = {
    createGuestValidator,
    getGuestValidator,
    updateGuestValidator,
    deleteGuestValidator
};
