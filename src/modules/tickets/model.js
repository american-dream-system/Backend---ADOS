const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "packageCategory"
    },
    page: {
        type: String,
        enum: ["funZone", "kidsArea", "challengeZone", "adventureZone"],
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
        required: true
    },
    pointsGets: {
        type: Number,
        default: 0
    },
    saveBadge: {
        type: String
    },
    badgeColor: {
        type: String,
        default: "badge-cyan"
    },
    description: {
        type: String,
        default: ""
    },
    features: {
        type: [String],
        default: []
    },
    bundle: {
        type: String,
        default: ""
    },
    age: {
        type: String,
        required: true
    },
    priceType: {
        type: String,
        enum: ["hour", "game", "all-day"],
        default: "all-day"
    },
    hourPrice: {
        type: Number
    },
    gamesPrice: {
        type: Number
    },
    image: {
        type: String,
        required: true
    },
    thumb: {
        type: String
    },
    used: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("ticket", ticketSchema);