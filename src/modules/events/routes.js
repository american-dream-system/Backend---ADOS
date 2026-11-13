const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { protectGuest } = require("../../middlewares/authMiddleware");
const { ownRecord, byId, byCode, ownGuestParam, ownGuestTarget } = require("../../middlewares/ownership");
const EventBooking = require("./model");
const own = { guestFields: ["guest"], phoneFields: ["contactPhone"] };

const {
    getEventSpaces,
    getBirthdayPackages,
    checkEventAvailability,
    createEventBooking,
    getEventByCode,
    getEventById,
    getAllEvents,
    getMyEvents,
    uploadDepositProof,
    updateEventBooking,
    updateEventStatus,
    deleteEventBooking
} = require("./services");

const {
    createEventBookingValidator,
    checkAvailabilityValidator,
    getEventByIdValidator,
    getEventByCodeValidator,
    updateEventStatusValidator
} = require("./validator");

// Public info endpoints
router.get("/spaces", getEventSpaces);
router.get("/packages", getBirthdayPackages);
router.get("/availability", checkAvailabilityValidator, checkEventAvailability);

// Create booking (for Birthday, Family Gathering, or Grand Hall)
router.post("/book", createEventBookingValidator, createEventBooking);
router.post("/", createEventBookingValidator, createEventBooking);

// Get my events (by phone or guest)
router.get("/my-events", protectGuest, getMyEvents);

// Get event by Code (e.g. BD-29401 or EV-10294)
router.get("/code/:code", ownRecord(byCode(EventBooking, "bookingCode"), own), getEventByCodeValidator, getEventByCode);

// Get all events (with pagination & filters)
router.get("/", adminOnly, getAllEvents);

// Get single event by ID
router.get("/:id", ownRecord(byId(EventBooking), own), getEventByIdValidator, getEventById);

// Upload payment proof for deposit
router.post("/:id/deposit-proof", getEventByIdValidator, uploadDepositProof);

// Update booking details
router.put("/:id", adminOnly, getEventByIdValidator, updateEventBooking);

// Update status
router.patch("/:id/status", adminOnly, updateEventStatusValidator, updateEventStatus);

// Delete event booking
router.delete("/:id", adminOnly, getEventByIdValidator, deleteEventBooking);

module.exports = router;
