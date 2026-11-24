const mongoose = require("mongoose");

// Single-document store for the School Trips pages: the hero banner (shared by the landing page and the booking form),
// the photo on the booking confirmation, and the landing page Gallery (ordered list of photos).
// Each image is one image for both languages. Empty string = no image set: the public page shows a neutral
// placeholder (there are no built-in images).
const galleryItemSchema = new mongoose.Schema({ image: { type: String, required: true } }, { _id: true });

const tripsHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "trips-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            success: { type: String, default: "" },
        },
        gallery: { type: [galleryItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TripsHome", tripsHomeSchema);
