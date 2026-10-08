const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
    nameEn: {
        type: String,
        required: true,
        trim: true
    },
    nameAr: {
        type: String,
        required: true,
        trim: true
    },
    descEn: {
        type: String,
        required: true,
        trim: true
    },
    descAr: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priceAfterDiscount: {
        type: Number,
        min: 0
    },
    category: {
        type: String,
        enum: ["burgers", "pizza", "grills", "drinks", "coffee", "sweets", "meals", "food", "desserts", "cafe"],
        required: true
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5
    },
    image: {
        type: String,
        required: true
    },
    isChefSpecial: {
        type: Boolean,
        default: false
    },
    available: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
