const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { ownGuestTarget } = require("../../middlewares/ownership");

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
router.get("/summary", adminOnly, getAllGuestsSummary);

// Full history by query params
router.get("/full-history", ownGuestTarget, getGuestFullHistory);
router.get("/history", ownGuestTarget, getGuestFullHistory);

// Full history by ID or Phone
router.get("/:id/full-history", ownGuestTarget, getGuestFullHistory);
router.get("/:id/history", ownGuestTarget, getGuestFullHistory);
router.get("/:id/transactions", ownGuestTarget, getGuestFullHistory);

// ==========================================
// GUEST CRUD ROUTES (Admin / Dashboard)
// ==========================================

router.route("/")
    .post(adminOnly, createGuestValidator, createGuest)
    .get(adminOnly, getAllGuests);

router.route("/:id")
    .get(ownGuestTarget, getGuestValidator, getGuestById)
    .put(adminOnly, updateGuestValidator, updateGuest)
    .delete(adminOnly, deleteGuestValidator, deleteGuest);

module.exports = router;