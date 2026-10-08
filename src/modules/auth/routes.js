const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    forgetPassword,
    verifyResetCode,
    resetPassword,
    refreshTokenService,
    getMe
} = require("./services");

const {
    signupValidator,
    loginValidator,
    forgetPasswordValidator,
    verifyResetCodeValidator,
    resetPasswordValidator
} = require("./validator");

const { protectGuest } = require("../../middlewares/authMiddleware");

// Sign up
router.post("/signup", signupValidator, signup);

// Login
router.post("/login", loginValidator, login);

// Forget Password / Send Reset Code
router.post("/forgot-password", forgetPasswordValidator, forgetPassword);
router.post("/forgetPassword", forgetPasswordValidator, forgetPassword);

// Verify Reset Code
router.post("/verify-code", verifyResetCodeValidator, verifyResetCode);
router.post("/verifyResetCode", verifyResetCodeValidator, verifyResetCode);

// Reset Password
router.post("/reset-password", resetPasswordValidator, resetPassword);
router.post("/resetPassword", resetPasswordValidator, resetPassword);

// Refresh Token
router.post("/refresh-token", refreshTokenService);
router.post("/refreshToken", refreshTokenService);

// Current User Profile
router.get("/me", protectGuest, getMe);

module.exports = router;
