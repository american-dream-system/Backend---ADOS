const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");
const TripBooking = require("./model");
const { notPastEgyptDate } = require("../../utils/egyptDate");

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
        .isISO8601().withMessage("صيغة تاريخ الرحلة غير صحيحة (مثال: 2026-10-24)")
        .bail().custom(notPastEgyptDate),

    // The smallest group depends on the chosen offer and is checked on the server with that offer
    check("studentsCount")
        .optional()
        .isInt({ min: 1 }).withMessage("عدد الطلاب يجب أن يكون رقماً صحيحاً موجباً"),
    check("orgType")
        .optional()
        .isIn(TripBooking.ORG_TYPES)
        .withMessage(`نوع الجهة غير صالح. القيم المقبولة: ${TripBooking.ORG_TYPES.slice(0, 5).join(", ")}`),

    check("shift")
        .optional()
        .isIn(["morning", "evening"]).withMessage("الفترة يجب أن تكون صباحية (morning) أو مسائية (evening)"),

    check("offerId")
        .notEmpty().withMessage("باقة الرحلة مطلوبة")
        .isMongoId().withMessage("باقة الرحلة المختارة غير صالحة"),
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
