const mongoose = require("mongoose");

// Single-document store for the editable parts of the Restaurant & Cafe home page.
// Empty string = "not set by the admin": the public page keeps its current default.
const textSchema = new mongoose.Schema(
    {
        en: { type: String, default: "", trim: true },
        ar: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const cardSchema = new mongoose.Schema(
    {
        title: { type: textSchema, default: () => ({}) },
        description: { type: textSchema, default: () => ({}) },
    },
    { _id: false }
);

const restaurantHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "restaurant-home", unique: true },
        images: {
            hero: { type: String, default: "" },
            "book-table": { type: String, default: "" },
            delivery: { type: String, default: "" },
            menu: { type: String, default: "" },
        },
        heroChip: { type: textSchema, default: () => ({}) },
        heroTitle: { type: textSchema, default: () => ({}) },
        heroSubtitle: { type: textSchema, default: () => ({}) },
        cards: {
            "book-table": { type: cardSchema, default: () => ({}) },
            delivery: { type: cardSchema, default: () => ({}) },
            menu: { type: cardSchema, default: () => ({}) },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RestaurantHome", restaurantHomeSchema);
