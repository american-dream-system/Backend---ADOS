const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    pointsGets: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceAfterDiscount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    page: {
        type: String,
        enum: ["funZone", "kidsArea", "challengeZone", "adventureZone"],
        required: true
    },
    priceType: {
        type: String,
        enum: ["hour", "game"],
        required: true
    },
    hourPrice: {
        type: Number,
        required: true
    },
    gamesPrice: {
        type: Number
    },
    age: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("ticket", ticketSchema);