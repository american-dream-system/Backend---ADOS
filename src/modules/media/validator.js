const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة رفع وسائط جديدة
const uploadMediaValidator = [
    check("name")
        .notEmpty().withMessage("اسم الصورة أو العنصر مطلوب"),

    check("section")
        .notEmpty().withMessage("اسم القسم مطلوب (مثل: hero, explore, vibes, general)"),

    check("page")
        .notEmpty().withMessage("اسم الصفحة التابع لها العنصر مطلوب (مثل: home, kidsArea, funZone, adventure, challenge, events)"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف وسائط بواسطة المعرف
const deleteMediaValidator = [
    check("id")
        .isMongoId().withMessage("معرف الوسائط غير صالح"),

    validatorMiddleware
];

module.exports = {
    uploadMediaValidator,
    deleteMediaValidator
};
