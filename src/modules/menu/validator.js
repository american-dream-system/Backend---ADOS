const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddlewar");

// @desc التحقق من صحة بيانات إنشاء صنف جديد في قائمة الطعام
const createMenuItemValidator = [
    check("nameEn")
        .notEmpty().withMessage("اسم الصنف باللغة الإنجليزية مطلوب")
        .isLength({ min: 2 }).withMessage("يجب ألا يقل اسم الصنف بالإنجليزية عن حرفين"),

    check("nameAr")
        .notEmpty().withMessage("اسم الصنف باللغة العربية مطلوب")
        .isLength({ min: 2 }).withMessage("يجب ألا يقل اسم الصنف بالعربية عن حرفين"),

    check("descEn")
        .notEmpty().withMessage("وصف الصنف باللغة الإنجليزية مطلوب"),

    check("descAr")
        .notEmpty().withMessage("وصف الصنف باللغة العربية مطلوب"),

    check("price")
        .notEmpty().withMessage("سعر الصنف مطلوب")
        .isNumeric().withMessage("سعر الصنف يجب أن يكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("سعر الصنف لا يمكن أن يكون سالباً");
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

    check("category")
        .notEmpty().withMessage("تصنيف الصنف مطلوب")
        .isIn(["burgers", "pizza", "grills", "drinks", "coffee", "sweets", "meals", "food", "desserts", "cafe"])
        .withMessage("تصنيف الصنف غير صالح"),

    check("rating")
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage("التقييم يجب أن يكون بين 1 و 5"),

    check("image")
        .custom((val, { req }) => {
            if (!req.file && !req.body.image) {
                throw new Error("صورة الصنف مطلوبة (عبر رفع ملف أو رابط الصورة)");
            }
            return true;
        }),

    validatorMiddleware
];

// @desc التحقق من صحة معرف الصنف
const getMenuItemValidator = [
    check("id")
        .isMongoId().withMessage("معرف الصنف غير صالح"),

    validatorMiddleware
];

// @desc التحقق من صحة تعديل صنف بقائمة الطعام
const updateMenuItemValidator = [
    check("id")
        .isMongoId().withMessage("معرف الصنف غير صالح"),

    check("nameEn")
        .optional()
        .isLength({ min: 2 }).withMessage("يجب ألا يقل اسم الصنف بالإنجليزية عن حرفين"),

    check("nameAr")
        .optional()
        .isLength({ min: 2 }).withMessage("يجب ألا يقل اسم الصنف بالعربية عن حرفين"),

    check("price")
        .optional()
        .isNumeric().withMessage("سعر الصنف يجب أن يكون رقماً")
        .custom((val) => {
            if (val < 0) throw new Error("سعر الصنف لا يمكن أن يكون سالباً");
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

    check("category")
        .optional()
        .isIn(["burgers", "pizza", "grills", "drinks", "coffee", "sweets", "meals", "food", "desserts", "cafe"])
        .withMessage("تصنيف الصنف غير صالح"),

    check("rating")
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage("التقييم يجب أن يكون بين 1 و 5"),

    validatorMiddleware
];

// @desc التحقق من صحة حذف صنف
const deleteMenuItemValidator = [
    check("id")
        .isMongoId().withMessage("معرف الصنف غير صالح"),

    validatorMiddleware
];

// Helper middleware to parse JSON string items if sent via multipart/form-data
const parseFormDataJsonFields = (req, res, next) => {
    if (typeof req.body.items === "string") {
        try {
            req.body.items = JSON.parse(req.body.items);
        } catch (e) {}
    }
    next();
};

// @desc التحقق من صحة طلب طعام / توصيل
const placeOrderValidator = [
    parseFormDataJsonFields,

    check("items")
        .isArray({ min: 1 })
        .withMessage("يجب إرسال مصفوفة أصناف تحتوي على صنف واحد على الأقل"),

    check("customerPhone")
        .optional()
        .isLength({ min: 8 })
        .withMessage("رقم الهاتف يجب أن يحتوي على 8 أرقام على الأقل"),

    check("deliveryFee")
        .optional()
        .isNumeric()
        .withMessage("رسوم التوصيل يجب أن تكون رقماً"),

    check("guest")
        .optional()
        .isMongoId().withMessage("معرف الضيف غير صالح"),

    validatorMiddleware
];

module.exports = {
    createMenuItemValidator,
    getMenuItemValidator,
    updateMenuItemValidator,
    deleteMenuItemValidator,
    placeOrderValidator
};
