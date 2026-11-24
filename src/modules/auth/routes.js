const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    forgetPassword,
    verifyResetCode,
    resetPassword,
    refreshTokenService,
    getMe,
    updateMe,
    changePassword
} = require("./services");

const {
    signupValidator,
    loginValidator,
    forgetPasswordValidator,
    verifyResetCodeValidator,
    resetPasswordValidator
} = require("./validator");

const { protectGuest } = require("../../middlewares/authMiddleware");
const L = require("../../middlewares/rateLimits");

// Sign up
router.post("/signup", L.signupPerIp, signupValidator, signup);

// Login
router.post("/login", L.loginPerIp, L.loginPerAccount, loginValidator, login);

// Forget Password / Send Reset Code
router.post("/forgot-password", L.forgotPerIp, L.forgotPerAccount, forgetPasswordValidator, forgetPassword);
router.post("/forgetPassword", L.forgotPerIp, L.forgotPerAccount, forgetPasswordValidator, forgetPassword);

// Verify Reset Code
router.post("/verify-code", L.resetPerIp, L.resetPerAccount, verifyResetCodeValidator, verifyResetCode);
router.post("/verifyResetCode", L.resetPerIp, L.resetPerAccount, verifyResetCodeValidator, verifyResetCode);

// Reset Password
router.post("/reset-password", L.resetPerIp, L.resetPerAccount, resetPasswordValidator, resetPassword);
router.post("/resetPassword", L.resetPerIp, L.resetPerAccount, resetPasswordValidator, resetPassword);

// Refresh Token
router.post("/refresh-token", refreshTokenService);
router.post("/refreshToken", refreshTokenService);

// Current User Profile
router.get("/me", protectGuest, getMe);
router.put("/me", L.accountPerIp, protectGuest, L.accountPerAccount, updateMe);
router.post("/change-password", L.accountPerIp, protectGuest, L.accountPerAccount, changePassword);

module.exports = router;
