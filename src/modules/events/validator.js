const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// Validator for creating event/hall booking
const createEventBookingValidator = [
    check("contactName")
        .notEmpty().withMessage("اسم العميل أو منظم الحفل مطلوب"),

    check("contactPhone")
        .notEmpty().withMessage("رقم الهاتف مطلوب"),

    check("space")
        .notEmpty().withMessage("مكان أو قاعة الحفل مطلوبة")
        .isIn(["indoor", "roof", "outdoor", "grand_ballroom"])
        .withMessage("القاعة المختارة غير صحيحة (indoor, roof, outdoor, grand_ballroom)"),

    check("eventDate")
        .notEmpty().withMessage("تاريخ المناسبة مطلوب")
        .isISO8601().withMessage("صيغة تاريخ المناسبة غير صحيحة (مثال: 2026-10-24)"),

    check("session")
        .notEmpty().withMessage("فترة الحفل مطلوبة")
        .isIn(["morning", "afternoon", "evening", "full_day"])
        .withMessage("الفترة المختارة غير صالحة (morning, afternoon, evening, full_day)"),

    check("totalGuests")
        .optional()
        .isInt({ min: 1 }).withMessage("عدد الضيوف يجب أن يكون 1 على الأقل"),

    validatorMiddleware
];

// Validator for checking availability
const checkAvailabilityValidator = [
    check("date")
        .notEmpty().withMessage("تاريخ المناسبة مطلوب للفحص")
        .isISO8601().withMessage("صيغة التاريخ غير صالحة"),

    check("space")
        .notEmpty().withMessage("القاعة مطلوبة للفحص")
        .isIn(["indoor", "roof", "outdoor", "grand_ballroom"])
        .withMessage("القاعة المختارة غير صالحة"),

    validatorMiddleware
];

// Validator for fetching by ID
const getEventByIdValidator = [
    check("id")
        .isMongoId().withMessage("معرف الحجز غير صالح"),
    validatorMiddleware
];

// Validator for fetching by Code
const getEventByCodeValidator = [
    check("code")
        .notEmpty().withMessage("رمز الحجز مطلوب"),
    validatorMiddleware
];

// Validator for updating status
const updateEventStatusValidator = [
    check("id")
        .isMongoId().withMessage("معرف الحجز غير صالح"),
    check("status")
        .notEmpty().withMessage("الحالة مطلوبة")
        .customSanitizer(val => typeof val === "string" ? val.toLowerCase() : val)
        .isIn(["pending_deposit", "deposit_verified", "confirmed", "in_progress", "completed", "cancelled"])
        .withMessage("حالة الحجز غير صالحة"),
    validatorMiddleware
];


module.exports = {
    createEventBookingValidator,
    checkAvailabilityValidator,
    getEventByIdValidator,
    getEventByCodeValidator,
    updateEventStatusValidator
};
