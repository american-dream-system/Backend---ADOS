const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

const createEventRequestValidator = [
    check("kind").isIn(["birthday", "family", "meeting"]).withMessage("kind must be birthday, family or meeting"),
    check("customerName").isString().trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2 to 100 characters"),
    check("customerPhone")
        .customSanitizer((v) => String(v || "").replace(/[\s-]/g, ""))
        .matches(/^(?:\+?20|0)1[0125]\d{8}$/)
        .withMessage("Enter a valid Egyptian mobile number"),
    check("customerEmail").optional({ values: "falsy" }).isEmail().withMessage("The email address is not valid").isLength({ max: 120 }),
    check("eventDate").notEmpty().withMessage("Event date is required"),
    check("time").optional({ values: "null" }).isString().isLength({ max: 60 }).withMessage("Time is too long"),
    check("guestCount").optional({ values: "null" }).isInt({ min: 1, max: 500 }).withMessage("Guests must be a whole number"),
    check("notes").optional({ values: "null" }).isString().isLength({ max: 1000 }).withMessage("Notes can be up to 1000 characters"),
    check("venue").optional({ values: "null" }).isString().isLength({ max: 40 }),
    check("occasion").optional({ values: "null" }).isString().isLength({ max: 80 }),
    check("organizer").optional({ values: "null" }).isString().isLength({ max: 120 }),
    check("equipment").optional({ values: "null" }).isArray({ max: 20 }).withMessage("Equipment must be a list"),
    check("packageId").optional({ values: "null" }).isString().isLength({ max: 80 }),
    validatorMiddleware,
];

const statusValidator = [
    check("id").isMongoId().withMessage("Invalid booking id"),
    check("status").isIn(["pending", "confirmed", "completed", "cancelled", "rejected"]).withMessage("Invalid status"),
    check("rejectionReason").optional({ values: "null" }).isString().isLength({ max: 300 }),
    validatorMiddleware,
];

module.exports = { createEventRequestValidator, statusValidator };
