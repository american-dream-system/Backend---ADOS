const express = require("express");
const router = express.Router();
const {
    createBuying,
    getAllBuyings,
    getBuyingById,
    getBuyingByCode,
    getBuyingsByGuest,
    redeemBuying,
    updateBuyingStatus,
    deleteBuying
} = require("./services");
const {
    createBuyingValidator,
    getBuyingValidator,
    getBuyingByCodeValidator,
    getBuyingsByGuestValidator,
    redeemBuyingValidator,
    updateBuyingStatusValidator,
    deleteBuyingValidator
} = require("./validator");

// Buy tickets and/or packages
router.post("/", createBuyingValidator, createBuying);

// Get all purchases (supports pagination & filtering)
router.get("/", getAllBuyings);

// Find purchase by QR / order code (PZ-XXXXXX)
router.get("/code/:code", getBuyingByCodeValidator, getBuyingByCode);

// Find all purchases for a guest
router.get("/guest/:guestId", getBuyingsByGuestValidator, getBuyingsByGuest);

// Find purchase by MongoDB ID
router.get("/:id", getBuyingValidator, getBuyingById);

// Redeem / scan pass at turnstile gate by code
router.patch("/code/:code/redeem", redeemBuyingValidator, redeemBuying);

// Redeem / scan pass at turnstile gate by ID
router.patch("/:id/redeem", redeemBuyingValidator, redeemBuying);

// Update status / payment status
router.patch("/:id/status", updateBuyingStatusValidator, updateBuyingStatus);

// Delete / cancel purchase
router.delete("/:id", deleteBuyingValidator, deleteBuying);

module.exports = router;
