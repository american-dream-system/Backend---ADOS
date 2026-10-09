const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// Validator for creating quote / booking
const createTripQuoteValidator = [
    check("orgName")
        .notEmpty().withMessage("اسم المدرسة أو المنظمة مطلوب"),

    check("contactName")
        .notEmpty().withMessage("اسم المنسق المسؤول مطلوب"),

    check("phone")
        .notEmpty().withMessage("رقم الهاتف مطلوب"),

    check("tripDate")
        .notEmpty().withMessage("تاريخ الرحلة مطلوب")
        .isISO8601().withMessage("صيغة تاريخ الرحلة غير صحيحة (مثال: 2026-10-24)"),

    check("studentsCount")
        .optional()
        .isInt({ min: 15 }).withMessage("الحد الأدنى لعدد الطلاب هو 15 طالباً"),

    check("shift")
        .optional()
        .isIn(["morning", "evening"]).withMessage("الفترة يجب أن تكون صباحية (morning) أو مسائية (evening)"),

    check("offerId")
        .optional()
        .isIn(["full-dream", "play-dine", "play-zone", "custom"])
        .withMessage("باقة الرحلة المختارة غير صالحة"),

    validatorMiddleware
];

// Validator for fetching by ID
const getTripByIdValidator = [
    check("id")
        .isMongoId().withMessage("معرف الرحلة غير صالح"),
    validatorMiddleware
];

// Validator for fetching by Code
const getTripByCodeValidator = [
    check("code")
        .notEmpty().withMessage("رمز عرض السعر / الرحلة مطلوب"),
    validatorMiddleware
];

// Validator for updating status
const updateTripStatusValidator = [
    check("id")
        .isMongoId().withMessage("معرف الرحلة غير صالح"),
    check("status")
        .notEmpty().withMessage("الحالة مطلوبة")
        .customSanitizer(val => typeof val === "string" ? val.toLowerCase() : val)
        .isIn(["quote_generated", "inquiry", "pending", "confirmed", "completed", "cancelled"])
        .withMessage("حالة الرحلة غير صالحة"),
    validatorMiddleware
];


module.exports = {
    createTripQuoteValidator,
    getTripByIdValidator,
    getTripByCodeValidator,
    updateTripStatusValidator
};
