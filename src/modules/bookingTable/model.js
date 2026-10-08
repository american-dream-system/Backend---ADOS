const mongoose = require("mongoose");

const bookingTableSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        unique: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest",
        required: true
    },
    guestName: {
        type: String
    },
    guestPhone: {
        type: String
    },
    area: {
        type: String,
        enum: ["Family 1", "Family 2", "Family 3", "Roof", "Indoor", "Relaxation Area"],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    numberOfPerson: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    }
}, { timestamps: true });

const BookingTable = mongoose.model("BookingTable", bookingTableSchema);
module.exports = BookingTable;