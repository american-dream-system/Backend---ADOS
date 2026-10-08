const express = require("express");
const router = express.Router();

const {
    createGuest,
    getAllGuests,
    getGuestById,
    updateGuest,
    deleteGuest
} = require("./services");

const {
    createGuestValidator,
    getGuestValidator,
    updateGuestValidator,
    deleteGuestValidator
} = require("./validator");

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