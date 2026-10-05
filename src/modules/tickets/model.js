const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    expire: {
        type: Date,
        required: true
    },
    children: {
        type: Number,
        required: true
    },
    adults: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ["one-day", "one-time", "afternoon", "full-day", "annual"],
        required: true
    },
    duration: {
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model("ticket", ticketSchema);