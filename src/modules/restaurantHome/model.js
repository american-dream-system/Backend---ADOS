const mongoose = require("mongoose");

// Single-document store for the Restaurant & Cafe home page: the four fixed images (hero + 3 cards)
// and the gallery section (ordered list of images with an editable bilingual title).
// Empty string = "not set by the admin": the public page keeps its current default.
const textSchema = new mongoose.Schema(
    {
        en: { type: String, default: "", trim: true },
        ar: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const galleryItemSchema = new mongoose.Schema({ image: { type: String, required: true } }, { _id: true });

const restaurantHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "restaurant-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            "book-table": { type: String, default: "" },
            delivery: { type: String, default: "" },
            menu: { type: String, default: "" },
        },
        galleryTitle: { type: textSchema, default: () => ({}) },
        gallery: { type: [galleryItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RestaurantHome", restaurantHomeSchema);
