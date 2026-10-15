const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

const ALLOWED_PAGES = [
    "packages",
    "package",
    "challenge",
    "challengeZone",
    "adventure",
    "adventureZone",
    "kids-area",
    "kidsArea",
    "fun-park",
    "funZone"
];

// @desc التحقق من صحة بيانات إنشاء تذكرة جديدة
const createTicketValidator = [
    check("title")
        .notEmpty().withMessage("عنوان التذكرة مطلوب")
        .isLength({ min: 2 }).withMessage("يجب ألا يقل عنوان التذكرة عن حرفين"),

    check("price")
        .notEmpty().withMessage("سعر التذكرة مطلوب")
        .isNumeric().withMessage("سعر التذكرة يجب أن يكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("سعر التذكرة لا يمكن أن يكون سالباً");
            return true;
        }),

    check("priceAfterDiscount")
        .optional()
        .isNumeric().withMessage("السعر بعد الخصم يجب أن يكون رقماً")
        .custom((val, { req }) => {
            if (val < 0) throw new Error("السعر بعد الخصم لا يمكن أن يكون سالباً");
            if (req.body.price && val > req.body.price) {
                throw new Error("السعر بعد الخصم يجب أن يكون أقل من أو يساوي السعر الأساسي");
            }
            return true;
        }),

    check("pointsGets")
        .optional()
        .isNumeric().withMessage("نقاط الولاء يجب أن تكون رقماً"),

    check("description")
        .optional(),

    check("page")
        .notEmpty().withMessage("الصفحة أو المنطقة التابعة لها التذكرة مطلوبة")
        .isIn(ALLOWED_PAGES)
        .withMessage("المنطقة غير صحيحة، الصفحات المتاحة: (packages, challenge, adventure, kids-area, fun-park)"),

    check("priceType")
        .optional(),

    check("hourPrice")
        .optional()
        .isNumeric().withMessage("سعر الساعة يجب أن يكون رقماً"),

    check("gamesPrice")
        .optional()
        .isNumeric().withMessage("سعر الألعاب يجب أن يكون رقماً"),

    check("age")
        .optional(),

    check("image")
        .optional(),

    validatorMiddleware
];

// @desc التحقق من صحة جلب تذكرة بالمعرف
const getTicketValidator = [
    check("id")
        .isMongoId().withMessage("معرف التذكرة غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تعديل تذكرة
const updateTicketValidator = [
    check("id")
        .isMongoId().withMessage("معرف التذكرة غير صالح"),

    check("price")
        .optional()
        .isNumeric().withMessage("سعر التذكرة يجب أن يكون رقماً"),

    check("priceAfterDiscount")
        .optional()
        .isNumeric().withMessage("السعر بعد الخصم يجب أن يكون رقماً"),

    check("pointsGets")
        .optional()
        .isNumeric().withMessage("نقاط الولاء يجب أن تكون رقماً"),

    check("page")
        .optional()
        .isIn(ALLOWED_PAGES)
        .withMessage("المنطقة غير صحيحة، الصفحات المتاحة: (packages, challenge, adventure, kids-area, fun-park)"),

    check("priceType")
        .optional(),

    check("hourPrice")
        .optional()
        .isNumeric().withMessage("سعر الساعة يجب أن يكون رقماً"),

    check("gamesPrice")
        .optional()
        .isNumeric().withMessage("سعر الألعاب يجب أن يكون رقماً"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف تذكرة
const deleteTicketValidator = [
    check("id")
        .isMongoId().withMessage("معرف التذكرة غير صالح"),

    validatorMiddleware
];

module.exports = {
    createTicketValidator,
    getTicketValidator,
    updateTicketValidator,
    deleteTicketValidator,
    ALLOWED_PAGES
};

