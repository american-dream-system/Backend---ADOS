const mongoose = require("mongoose");

// Single-document store for the Restaurant & Cafe home page: the four fixed images (hero + 3 cards)
// and the gallery section (ordered list of images; its title is fixed on the page).
// Empty string = "not set by the admin": the public page keeps its current default.
const galleryItemSchema = new mongoose.Schema({ image: { type: String, required: true } }, { _id: true });

const restaurantHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "restaurant-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            "book-table": { type: String, default: "" },
            delivery: { type: String, default: "" },
            menu: { type: String, default: "" },
            "table-hero": { type: String, default: "" },
            "delivery-hero": { type: String, default: "" },
        },
        gallery: { type: [galleryItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RestaurantHome", restaurantHomeSchema);
