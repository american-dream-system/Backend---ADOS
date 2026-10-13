const { check, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة رفع وسائط جديدة
const uploadMediaValidator = [
    check("section")
        .notEmpty().withMessage("اسم القسم مطلوب (مثل: hero, explore, vibes, general, experiences)"),

    check("page")
        .notEmpty().withMessage("اسم الصفحة التابع لها العنصر مطلوب"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف وسائط بواسطة المعرف
const deleteMediaValidator = [
    check("id")
        .isMongoId().withMessage("معرف الوسائط غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة معرف القسم والصفحة في المعاملات
const sectionParamValidator = [
    param("page")
        .notEmpty().withMessage("اسم الصفحة مطلوب"),
    param("section")
        .notEmpty().withMessage("اسم القسم مطلوب"),
    validatorMiddleware
];

module.exports = {
    uploadMediaValidator,
    deleteMediaValidator,
    sectionParamValidator
};

