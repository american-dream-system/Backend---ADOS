const mongoose = require("mongoose");

// Single-document store for the School Trips page images: the hero banner and the photo on the booking confirmation.
// Each image is one image for both languages. Empty string = no image set: the public page shows a neutral
// placeholder (there are no built-in images).
const tripsHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "trips-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            success: { type: String, default: "" },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TripsHome", tripsHomeSchema);
