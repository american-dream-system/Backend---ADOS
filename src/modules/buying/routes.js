const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../../middlewares/uploadImages");
const {
    resizePaymentProofImage,
    getPaymentAccounts,
    createBuying,
    uploadPaymentProof,
    verifyPayment,
    markCashCollected,
    getPendingVerifications,
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
    verifyPaymentValidator,
    markCashCollectedValidator,
    deleteBuyingValidator
} = require("./validator");

// 1. Get official payment accounts (InstaPay, Vodafone Cash, Cash rules)
router.get("/payment-accounts", getPaymentAccounts);

// 2. Admin: Get all purchases pending payment receipt verification
router.get("/pending-verification", getPendingVerifications);

// 3. Buy tickets and/or packages (Supports multipart/form-data with image proof OR JSON)
router.post(
    "/",
    uploadSingleImage("paymentProof"),
    resizePaymentProofImage,
    createBuyingValidator,
    createBuying
);

// 4. Upload/Update payment receipt proof for an existing purchase
router.post(
    "/:id/proof",
    uploadSingleImage("paymentProof"),
    resizePaymentProofImage,
    uploadPaymentProof
);
router.post(
    "/code/:code/proof",
    uploadSingleImage("paymentProof"),
    resizePaymentProofImage,
    uploadPaymentProof
);

// 5. Admin: Verify and approve/reject manual payment proof
router.patch(
    "/:id/verify-payment",
    verifyPaymentValidator,
    verifyPayment
);

// 6. Admin/Cashier: Mark cash collected on arrival at the gate and issue ticket pass
router.patch(
    "/:id/mark-cash-collected",
    markCashCollectedValidator,
    markCashCollected
);

// 7. Get all purchases (supports pagination & filtering)
router.get("/", getAllBuyings);

// 8. Find purchase by QR / order code (PZ-XXXXXX)
router.get("/code/:code", getBuyingByCodeValidator, getBuyingByCode);

// 9. Find all purchases for a guest
router.get("/guest/:guestId", getBuyingsByGuestValidator, getBuyingsByGuest);

// 10. Find purchase by MongoDB ID
router.get("/:id", getBuyingValidator, getBuyingById);

// 11. Redeem / scan pass at turnstile gate by code or ID
router.patch("/code/:code/redeem", redeemBuyingValidator, redeemBuying);
router.patch("/:id/redeem", redeemBuyingValidator, redeemBuying);

// 12. Update status / payment status
router.patch("/:id/status", updateBuyingStatusValidator, updateBuyingStatus);

// 13. Delete / cancel purchase
router.delete("/:id", deleteBuyingValidator, deleteBuying);

module.exports = router;
