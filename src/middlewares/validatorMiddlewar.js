const { validationResult } = require("express-validator");

const validatorMiddleware = (req, res, next) => {
    const error = validationResult(req);
    if (process.env.NODE_ENV === "development" && !error.isEmpty()) {
        console.log("Validation Errors:", error.array());
    }

    if (!error.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: error.array()[0].msg,
            errors: error.array()
        });
    }
    next();
};

module.exports = validatorMiddleware;
