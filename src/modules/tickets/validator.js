const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

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
        .notEmpty().withMessage("السعر بعد الخصم مطلوب")
        .isNumeric().withMessage("السعر بعد الخصم يجب أن يكون رقماً")
        .custom((val, { req }) => {
            if (val < 0) throw new Error("السعر بعد الخصم لا يمكن أن يكون سالباً");
            if (req.body.price && val > req.body.price) {
                throw new Error("السعر بعد الخصم يجب أن يكون أقل من أو يساوي السعر الأساسي");
            }
            return true;
        }),

    check("pointsGets")
        .notEmpty().withMessage("نقاط الولاء المكتسبة مطلوبة")
        .isNumeric().withMessage("نقاط الولاء يجب أن تكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("نقاط الولاء لا يمكن أن تكون سالبة");
            return true;
        }),

    check("description")
        .notEmpty().withMessage("وصف التذكرة مطلوب"),

    check("page")
        .notEmpty().withMessage("المنطقة أو الصفحة التابعة لها التذكرة مطلوبة")
        .isIn(["funZone", "kidsArea", "challengeZone", "adventureZone"])
        .withMessage("المنطقة غير صحيحة، الخيارات المتاحة: (funZone, kidsArea, challengeZone, adventureZone)"),

    check("priceType")
        .notEmpty().withMessage("نوع التسعير مطلوب")
        .isIn(["hour", "game"])
        .withMessage("نوع التسعير يجب أن يكون إما بالساعة (hour) أو باللعبة (game)"),

    check("hourPrice")
        .notEmpty().withMessage("سعر الساعة مطلوب")
        .isNumeric().withMessage("سعر الساعة يجب أن يكون رقماً"),

    check("gamesPrice")
        .optional()
        .isNumeric().withMessage("سعر الألعاب يجب أن يكون رقماً"),

    check("age")
        .notEmpty().withMessage("الفئة العمرية المسموح بها مطلوبة (مثل: Ages 1-6 أو Ages 8+)"),

    check("image")
        .notEmpty().withMessage("صورة التذكرة مطلوبة"),

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
        .isIn(["funZone", "kidsArea", "challengeZone", "adventureZone"])
        .withMessage("المنطقة غير صحيحة، الخيارات المتاحة: (funZone, kidsArea, challengeZone, adventureZone)"),

    check("priceType")
        .optional()
        .isIn(["hour", "game"])
        .withMessage("نوع التسعير يجب أن يكون إما بالساعة (hour) أو باللعبة (game)"),

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
    deleteTicketValidator
};
