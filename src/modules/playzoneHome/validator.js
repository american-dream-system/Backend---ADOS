const { body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const createPackageValidator = [
    body("titleEn").trim().notEmpty().withMessage("titleEn is required"),
    body("price").isFloat({ min: 0 }).withMessage("price must be a number >= 0"),
    validatorMiddleware,
];

const updatePackageValidator = [
    body("titleEn").optional().trim().notEmpty().withMessage("titleEn cannot be empty"),
    body("price").optional().isFloat({ min: 0 }).withMessage("price must be a number >= 0"),
    validatorMiddleware,
];

module.exports = { createPackageValidator, updatePackageValidator };
