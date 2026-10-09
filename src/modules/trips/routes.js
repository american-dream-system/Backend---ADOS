const express = require("express");
const router = express.Router();

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
router.get("/my-trips", getMyTrips);

// Get by Code (AD-TRIP-XXXX)
router.get("/code/:code", getTripByCodeValidator, getTripByCode);

// Get all trips (with pagination & filters)
router.get("/", getAllTrips);

// Get single trip by ID
router.get("/:id", getTripByIdValidator, getTripById);

// Update trip
router.put("/:id", getTripByIdValidator, updateTripBooking);

// Update status
router.patch("/:id/status", updateTripStatusValidator, updateTripStatus);

// Delete trip
router.delete("/:id", getTripByIdValidator, deleteTrip);

module.exports = router;
