const express = require("express");
const router = express.Router();
const {
    createBookingTable,
    getAllBookingTables,
    getBookingTableById,
    getBookingTableByCode,
    getBookingsByGuest,
    updateBookingTable,
    updateBookingStatus,
    deleteBookingTable,
    checkAvailability
} = require("./services");
const {
    createBookingTableValidator,
    getBookingTableValidator,
    getBookingTableByCodeValidator,
    getBookingsByGuestValidator,
    updateBookingTableValidator,
    updateBookingStatusValidator,
    deleteBookingTableValidator,
    checkAvailabilityValidator
} = require("./validator");

// Create table booking
router.post("/", createBookingTableValidator, createBookingTable);

// Get all bookings (with pagination & filters)
router.get("/", getAllBookingTables);

// Check seat & table availability for a specific date/time/area
router.get("/availability", checkAvailabilityValidator, checkAvailability);

// Get booking by unique reservation code (TB-XXXXXX)
router.get("/code/:code", getBookingTableByCodeValidator, getBookingTableByCode);

// Get all bookings for a specific guest
router.get("/guest/:guestId", getBookingsByGuestValidator, getBookingsByGuest);

// Get booking by ID
router.get("/:id", getBookingTableValidator, getBookingTableById);

// Update booking details
router.put("/:id", updateBookingTableValidator, updateBookingTable);

// Update booking status (pending, confirmed, cancelled)
router.patch("/:id/status", updateBookingStatusValidator, updateBookingStatus);

// Delete / Cancel booking
router.delete("/:id", deleteBookingTableValidator, deleteBookingTable);

module.exports = router;
