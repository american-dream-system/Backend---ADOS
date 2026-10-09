const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    priceAfterDiscount: {
        type: Number,
        default: 0
    },
    pointsGets: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
    },
    feature: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: ""
    },
    page: {
        type: String
    },
    category: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true, strict: false });

module.exports = mongoose.model("Package", packageSchema);