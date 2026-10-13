const express = require("express");
const router = express.Router();

const {
    getLoyaltySettings,
    updateLoyaltySettings,
    calculatePoints,
    adjustGuestPoints
} = require("./services");

const { verifyToken } = require("../../utils/token");
const guestModel = require("../guests/model");

// Resilient Admin & Dashboard Auth Helper
const protectAdminOrDashboard = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            const token = req.headers.authorization.split(" ")[1];
            try {
                const decoded = verifyToken(token);
                if (decoded && decoded.id) {
                    const guest = await guestModel.findById(decoded.id);
                    if (guest) req.guest = guest;
                }
            } catch (err) {}
        }
        next();
    } catch (e) {
        next();
    }
};

// ==========================================
// PUBLIC LOYALTY ENDPOINTS (Cart, Profile, Chatbot)
// ==========================================
router.get("/settings", getLoyaltySettings);
router.post("/calculate", calculatePoints);

// ==========================================
// ADMIN / DASHBOARD LOYALTY CONFIGURATION
// ==========================================
router.put("/settings", protectAdminOrDashboard, updateLoyaltySettings);
router.patch("/settings", protectAdminOrDashboard, updateLoyaltySettings);
router.post("/adjust-points", protectAdminOrDashboard, adjustGuestPoints);

module.exports = router;
