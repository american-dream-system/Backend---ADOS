const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");
const guestModel = require("../guests/model");

// @desc التحقق من صحة التسجيل (Sign Up)
const signupValidator = [
    check("name")
        .notEmpty().withMessage("الاسم مطلوب")
        .isLength({ min: 3 }).withMessage("يجب ألا يقل الاسم عن 3 أحرف"),

    check("email")
        .notEmpty().withMessage("البريد الإلكتروني مطلوب")
        .isEmail().withMessage("يرجى إدخال بريد إلكتروني صالح")
        .custom(async (val) => {
            const existing = await guestModel.findOne({ email: val.toLowerCase().trim() });
            if (existing) {
                throw new Error("البريد الإلكتروني مسجل بالفعل");
            }
            return true;
        }),

    check("password")
        .notEmpty().withMessage("كلمة المرور مطلوبة")
        .isLength({ min: 6 }).withMessage("كلمة المرور يجب ألا تقل عن 6 أحرف"),

    check("passwordConfirm")
        .optional()
        .custom((val, { req }) => {
            if (val && val !== req.body.password) {
                throw new Error("تأكيد كلمة المرور غير متطابق مع كلمة المرور");
            }
            return true;
        }),

    check("phone")
        .notEmpty().withMessage("رقم الهاتف مطلوب")
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("يجب إدخال رقم هاتف مصري صالح (11 رقم)")
        .custom(async (val) => {
            const existing = await guestModel.findOne({ phone: val.trim() });
            if (existing) {
                throw new Error("رقم الهاتف مسجل بالفعل");
            }
            return true;
        }),

    check("age")
        .optional(),

    check("gender")
        .optional()
        .isIn(["male", "female"]).withMessage("النوع يجب أن يكون إما ذكر (male) أو أنثى (female)"),

    validatorMiddleware
];

// @desc التحقق من صحة تسجيل الدخول (Login)
const loginValidator = [
    check("password")
        .notEmpty().withMessage("كلمة المرور مطلوبة"),

    check("email")
        .custom((val, { req }) => {
            if (!req.body.email && !req.body.phone && !req.body.identifier) {
                throw new Error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف لتسجيل الدخول");
            }
            return true;
        }),

    validatorMiddleware
];

// @desc التحقق من صحة نسيان كلمة المرور (Forget Password)
const forgetPasswordValidator = [
    check("email")
        .notEmpty().withMessage("البريد الإلكتروني مطلوب لإعادة تعيين كلمة المرور")
        .isEmail().withMessage("يرجى إدخال بريد إلكتروني صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة كود التحقق (Verify Reset Code)
const verifyResetCodeValidator = [
    check("email")
        .notEmpty().withMessage("البريد الإلكتروني مطلوب")
        .isEmail().withMessage("يرجى إدخال بريد إلكتروني صالح"),

    check("resetCode")
        .notEmpty().withMessage("كود التحقق مطلوب")
        .isLength({ min: 6, max: 6 }).withMessage("كود التحقق يجب أن يتكون من 6 أرقام"),

    validatorMiddleware
];

// @desc التحقق من صحة تعيين كلمة المرور الجديدة (Reset Password)
const resetPasswordValidator = [
    check("email")
        .notEmpty().withMessage("البريد الإلكتروني مطلوب")
        .isEmail().withMessage("يرجى إدخال بريد إلكتروني صالح"),

    check("newPassword")
        .notEmpty().withMessage("كلمة المرور الجديدة مطلوبة")
        .isLength({ min: 6 }).withMessage("كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف"),

    check("newPasswordConfirm")
        .optional()
        .custom((val, { req }) => {
            if (val && val !== req.body.newPassword) {
                throw new Error("تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة");
            }
            return true;
        }),

    validatorMiddleware
];

module.exports = {
    signupValidator,
    loginValidator,
    forgetPasswordValidator,
    verifyResetCodeValidator,
    resetPasswordValidator
};
