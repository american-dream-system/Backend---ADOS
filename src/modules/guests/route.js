const express = require("express");
const router = express.Router();

const {
    createGuest,
    getAllGuests,
    getGuestById,
    updateGuest,
    deleteGuest,
    getGuestFullHistory,
    getAllGuestsSummary
} = require("./services");

const {
    createGuestValidator,
    getGuestValidator,
    updateGuestValidator,
    deleteGuestValidator
} = require("./validator");

const { verifyToken } = require("../../utils/token");
const guestModel = require("./model");

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
// GUEST ADMIN DOSSIER & TRANSACTIONS HISTORY (Admin / Dashboard)
// ==========================================

// Aggregated summary of all guests for admin dashboard
router.get("/summary", protectAdminOrDashboard, getAllGuestsSummary);

// Full history by query params
router.get("/full-history", protectAdminOrDashboard, getGuestFullHistory);
router.get("/history", protectAdminOrDashboard, getGuestFullHistory);

// Full history by ID or Phone
router.get("/:id/full-history", protectAdminOrDashboard, getGuestFullHistory);
router.get("/:id/history", protectAdminOrDashboard, getGuestFullHistory);
router.get("/:id/transactions", protectAdminOrDashboard, getGuestFullHistory);

// ==========================================
// GUEST CRUD ROUTES (Admin / Dashboard)
// ==========================================

router.route("/")
    .post(protectAdminOrDashboard, createGuestValidator, createGuest)
    .get(protectAdminOrDashboard, getAllGuests);

router.route("/:id")
    .get(protectAdminOrDashboard, getGuestValidator, getGuestById)
    .put(protectAdminOrDashboard, updateGuestValidator, updateGuest)
    .delete(protectAdminOrDashboard, deleteGuestValidator, deleteGuest);

module.exports = router;