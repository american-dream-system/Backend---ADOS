const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    titleAr: {
        type: String,
        default: ""
    },
    titleEn: {
        type: String,
        default: ""
    },
    subtitle: {
        type: String,
        default: ""
    },
    subtitleAr: {
        type: String,
        default: ""
    },
    subtitleEn: {
        type: String,
        default: ""
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
        default: ""
    },
    descriptionAr: {
        type: String,
        default: ""
    },
    descriptionEn: {
        type: String,
        default: ""
    },
    feature: {
        type: [String],
        default: []
    },
    features: {
        type: [String],
        default: []
    },
    featuresAr: {
        type: [String],
        default: []
    },
    featuresEn: {
        type: [String],
        default: []
    },
    saveBadge: {
        type: String,
        default: ""
    },
    saveBadgeAr: {
        type: String,
        default: ""
    },
    saveBadgeEn: {
        type: String,
        default: ""
    },
    age: {
        type: String,
        default: "جميع الأعمار"
    },
    image: {
        type: String,
        default: ""
    },
    page: {
        type: String,
        default: "packages"
    },
    category: {
        type: String,
        default: "packages"
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true, strict: false });

module.exports = mongoose.model("Package", packageSchema);