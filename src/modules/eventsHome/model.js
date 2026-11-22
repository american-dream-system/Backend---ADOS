const mongoose = require("mongoose");

// Single-document store for the Birthdays & Events landing page: the hero image, one cover image for each of
// the three event types, and the "Explore our events" gallery (ordered list of images).
// Each image is one image for both languages. Empty string = no image set: the public page shows a neutral
// placeholder (there are no built-in images).
const galleryItemSchema = new mongoose.Schema({ image: { type: String, required: true } }, { _id: true });

const eventsHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "events-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            birthdays: { type: String, default: "" },
            occasions: { type: String, default: "" },
            meetings: { type: String, default: "" },
        },
        gallery: { type: [galleryItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EventsHome", eventsHomeSchema);
