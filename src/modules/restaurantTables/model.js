const mongoose = require("mongoose");

// Tables of the Restaurant & Cafe "Book a Table" page, managed from the admin.
// A "table" here is a seating area the guest picks when booking (Family 1, Roof, ...).

// Filter categories shown as chips on the public page. `kind` only drives special behaviour:
//   smoking / non-smoking : filled from each table's smoking status (not assignable with checkboxes)
//   indoor / outdoor      : a table cannot have both
//   families / ""         : plain categories (families only picks the chip icon)
const CATEGORY_KINDS = ["indoor", "outdoor", "smoking", "non-smoking", "families", ""];

const categorySchema = new mongoose.Schema(
    {
        nameEn: { type: String, required: true, trim: true },
        nameAr: { type: String, required: true, trim: true },
        kind: { type: String, enum: CATEGORY_KINDS, default: "" },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const tableSchema = new mongoose.Schema(
    {
        nameEn: { type: String, required: true, trim: true },
        nameAr: { type: String, required: true, trim: true },
        // Uploaded file name (upload/media) or a frontend static path (/photo/...) for the original tables
        image: { type: String, default: "" },
        smoking: { type: String, enum: ["smoking", "non-smoking"], required: true },
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "RestaurantTableCategory" }],
        // The `area` value older bookings used for this table (only the original tables have one). New tables book
        // with their English name.
        areaValue: { type: String, default: "", trim: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// One document that remembers the original tables were created, so deleting them all does not bring them back
const metaSchema = new mongoose.Schema({
    key: { type: String, default: "restaurant-tables", unique: true },
    seeded: { type: Boolean, default: false },
});

const Category = mongoose.models.RestaurantTableCategory || mongoose.model("RestaurantTableCategory", categorySchema);
const Table = mongoose.models.RestaurantTable || mongoose.model("RestaurantTable", tableSchema);
const Meta = mongoose.models.RestaurantTablesMeta || mongoose.model("RestaurantTablesMeta", metaSchema);

module.exports = { Table, Category, Meta, CATEGORY_KINDS };
