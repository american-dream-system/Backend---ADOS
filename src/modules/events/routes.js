const express = require("express");
const router = express.Router();

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
router.get("/my-events", getMyEvents);

// Get event by Code (e.g. BD-29401 or EV-10294)
router.get("/code/:code", getEventByCodeValidator, getEventByCode);

// Get all events (with pagination & filters)
router.get("/", getAllEvents);

// Get single event by ID
router.get("/:id", getEventByIdValidator, getEventById);

// Upload payment proof for deposit
router.post("/:id/deposit-proof", getEventByIdValidator, uploadDepositProof);

// Update booking details
router.put("/:id", getEventByIdValidator, updateEventBooking);

// Update status
router.patch("/:id/status", updateEventStatusValidator, updateEventStatus);

// Delete event booking
router.delete("/:id", getEventByIdValidator, deleteEventBooking);

module.exports = router;
