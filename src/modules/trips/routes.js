const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { protectGuest } = require("../../middlewares/authMiddleware");
const { ownRecord, byId, byCode, ownGuestParam, ownGuestTarget } = require("../../middlewares/ownership");
const TripBooking = require("./model");
const own = { guestFields: ["guest"], phoneFields: ["phone"] };

const {
    getTripOffers,
    calculateTripCost,
    createTripQuote,
    getTripByCode,
    getTripById,
    getAllTrips,
    getMyTrips,
    updateTripBooking,
    updateTripStatus,
    deleteTrip
} = require("./services");

const {
    createTripQuoteValidator,
    getTripByIdValidator,
    getTripByCodeValidator,
    updateTripStatusValidator
} = require("./validator");

// Public endpoints
router.get("/offers", getTripOffers);
router.get("/packages", getTripOffers);
router.post("/calculate", calculateTripCost);

// Create quote / booking
router.post("/quote", createTripQuoteValidator, createTripQuote);
router.post("/book", createTripQuoteValidator, createTripQuote);
router.post("/", createTripQuoteValidator, createTripQuote);

// Get my trips (query by phone or guestId)
router.get("/my-trips", protectGuest, getMyTrips);

// Get by Code (AD-TRIP-XXXX)
router.get("/code/:code", ownRecord(byCode(TripBooking, "bookingCode"), own), getTripByCodeValidator, getTripByCode);

// Get all trips (with pagination & filters)
router.get("/", adminOnly, getAllTrips);

// Get single trip by ID
router.get("/:id", ownRecord(byId(TripBooking), own), getTripByIdValidator, getTripById);

// Update trip
router.put("/:id", adminOnly, getTripByIdValidator, updateTripBooking);

// Update status
router.patch("/:id/status", adminOnly, updateTripStatusValidator, updateTripStatus);

// Delete trip
router.delete("/:id", adminOnly, getTripByIdValidator, deleteTrip);

module.exports = router;
