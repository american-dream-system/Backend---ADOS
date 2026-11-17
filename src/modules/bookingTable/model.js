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
    // Area name sent by the client. Tables are managed in the admin (RestaurantTable), so this is no longer a fixed
    // list: tables created before keep their original value (areaValue), new tables use their English name.
    area: {
        type: String,
        trim: true,
        required: true
    },
    // The managed table that was booked, with the names it had at booking time (kept even if the table is
    // renamed or deleted later)
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RestaurantTable",
        default: null
    },
    tableNameEn: {
        type: String,
        default: ""
    },
    tableNameAr: {
        type: String,
        default: ""
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
    // numberOfPerson stays the total. adults / children are the split the guest chose; bookings made before the
    // split (or by the chatbot) have neither and show only the total.
    adults: {
        type: Number,
        min: 0,
        default: null
    },
    children: {
        type: Number,
        min: 0,
        default: null
    },
    highChair: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    }
}, { timestamps: true });

const BookingTable = mongoose.model("BookingTable", bookingTableSchema);
module.exports = BookingTable;