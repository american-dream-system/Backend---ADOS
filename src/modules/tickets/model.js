const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
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
    category: {
        type: mongoose.Schema.Types.Mixed,
        default: ""
    },
    page: {
        type: String,
        required: true
    },
    timing: {
        type: String,
        enum: ["midweek", "weekend", "all"],
        default: "all"
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
    saveBadge: {
        type: String
    },
    saveBadgeAr: {
        type: String,
        default: ""
    },
    saveBadgeEn: {
        type: String,
        default: ""
    },
    badgeColor: {
        type: String,
        default: "badge-cyan"
    },
    description: {
        type: String,
        default: ""
    },
    descriptionAr: {
        type: String,
        default: ""
    },
    features: {
        type: [String],
        default: []
    },
    featuresAr: {
        type: [String],
        default: []
    },
    bundle: {
        type: String,
        default: ""
    },
    bundleAr: {
        type: String,
        default: ""
    },
    extra: {
        type: String,
        default: ""
    },
    extraAr: {
        type: String,
        default: ""
    },
    age: {
        type: String,
        default: "All Ages"
    },
    ageAr: {
        type: String,
        default: "جميع الأعمار"
    },
    priceType: {
        type: String,
        default: "all-day"
    },
    hourPrice: {
        type: Number,
        default: 0
    },
    gamesPrice: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ""
    },
    thumb: {
        type: String,
        default: ""
    },
    unit: {
        type: String,
        default: "/ ticket"
    },
    active: {
        type: Boolean,
        default: true
    },
    used: {
        type: Boolean,
        default: false
    }
}, { timestamps: true, strict: false });

module.exports = mongoose.model("ticket", ticketSchema);