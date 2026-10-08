const { check, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة إرسال رسالة للمساعد الذكي
const sendMessageValidator = [
    check("message")
        .notEmpty().withMessage("نص الرسالة مطلوب ولا يمكن أن يكون فارغاً")
        .isString().withMessage("نص الرسالة يجب أن يكون نصياً")
        .trim(),

    check("sessionId")
        .optional()
        .isString().withMessage("معرف الجلسة يجب أن يكون نصياً")
        .trim(),

    check("guestName")
        .optional()
        .isString().withMessage("اسم العميل يجب أن يكون نصياً")
        .trim(),

    check("guestPhone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("رقم الهاتف يجب أن يكون رقماً مصرياً صالحاً (11 رقم)"),

    validatorMiddleware
];

// @desc التحقق من صحة إنشاء جلسة محادثة جديدة
const createSessionValidator = [
    check("title")
        .optional()
        .isString().withMessage("عنوان الجلسة يجب أن يكون نصياً")
        .trim(),

    check("guestName")
        .optional()
        .isString().withMessage("اسم العميل يجب أن يكون نصياً")
        .trim(),

    check("guestPhone")
        .optional()
        .matches(/^(010|011|012|015)[0-9]{8}$/).withMessage("رقم الهاتف يجب أن يكون رقماً مصرياً صالحاً (11 رقم)"),

    validatorMiddleware
];

// @desc التحقق من صحة معامل معرف الجلسة
const sessionIdParamValidator = [
    param("sessionId")
        .notEmpty().withMessage("معرف الجلسة مطلوب في الرابط")
        .isString().withMessage("معرف الجلسة غير صالح"),

    validatorMiddleware
];

module.exports = {
    sendMessageValidator,
    createSessionValidator,
    sessionIdParamValidator
};
