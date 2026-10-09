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

// ==========================================
// GUEST ADMIN DOSSIER & TRANSACTIONS HISTORY
// ==========================================

// Aggregated summary of all guests for admin dashboard
router.get("/summary", getAllGuestsSummary);

// Full history by query params (e.g. /api/guests/full-history?phone=01012345678 or ?guestId=...)
router.get("/full-history", getGuestFullHistory);
router.get("/history", getGuestFullHistory);

// Full history by ID or Phone (e.g. /api/guests/:id/full-history or /api/guests/:id/history)
router.get("/:id/full-history", getGuestFullHistory);
router.get("/:id/history", getGuestFullHistory);
router.get("/:id/transactions", getGuestFullHistory);

// ==========================================
// GUEST CRUD ROUTES
// ==========================================

router.route("/")
    .post(createGuestValidator, createGuest)
    .get(getAllGuests);

router.route("/:id")
    .get(getGuestValidator, getGuestById)
    .put(updateGuestValidator, updateGuest)
    .delete(deleteGuestValidator, deleteGuest);

module.exports = router;