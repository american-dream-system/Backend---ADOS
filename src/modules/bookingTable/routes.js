const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { ownRecord, byId, byCode, ownGuestParam, ownGuestTarget } = require("../../middlewares/ownership");
const BookingTable = require("./model");
const own = { guestFields: ["guest"], phoneFields: ["guestPhone"] };
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
router.get("/", adminOnly, getAllBookingTables);

// Check seat & table availability for a specific date/time/area
router.get("/availability", checkAvailabilityValidator, checkAvailability);

// Get booking by unique reservation code (TB-XXXXXX)
router.get("/code/:code", ownRecord(byCode(BookingTable, "bookingCode"), own), getBookingTableByCodeValidator, getBookingTableByCode);

// Get all bookings for a specific guest
router.get("/guest/:guestId", ownGuestParam(), getBookingsByGuestValidator, getBookingsByGuest);

// Get booking by ID
router.get("/:id", ownRecord(byId(BookingTable), own), getBookingTableValidator, getBookingTableById);

// Update booking details
router.put("/:id", adminOnly, updateBookingTableValidator, updateBookingTable);

// Update booking status (pending, confirmed, cancelled)
router.patch("/:id/status", adminOnly, updateBookingStatusValidator, updateBookingStatus);

// Delete / Cancel booking
router.delete("/:id", adminOnly, deleteBookingTableValidator, deleteBookingTable);

module.exports = router;
