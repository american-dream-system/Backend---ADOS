const mongoose = require("mongoose");

// Single-document store for the Birthdays & Events landing page: the hero image, one cover image for each of
// the three event types, and the "Explore our events" gallery (ordered list of images).
// Each image is one image for both languages. Empty string = no image set: the public page shows a neutral
// placeholder (there are no built-in images).
const galleryItemSchema = new mongoose.Schema({ image: { type: String, required: true } }, { _id: true });

// Birthday Parties "Per Person Booking" card: one per-guest price (EGP) for Midweek and one for Weekend, each with
// its own "Price Includes" lines in English and Arabic. null price / empty list = not set (no built-in values).
const perPersonTierSchema = {
    price: { type: Number, default: null },
    includesEn: { type: [String], default: [] },
    includesAr: { type: [String], default: [] },
};

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
        birthdayPerPerson: {
            midweek: { type: new mongoose.Schema(perPersonTierSchema, { _id: false }), default: () => ({}) },
            weekend: { type: new mongoose.Schema(perPersonTierSchema, { _id: false }), default: () => ({}) },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EventsHome", eventsHomeSchema);
