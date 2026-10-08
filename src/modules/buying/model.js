const mongoose = require("mongoose");

const buyingTicketItemSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ticket",
        required: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    pointsGets: {
        type: Number,
        default: 0
    }
}, { _id: false });

const buyingPackageItemSchema = new mongoose.Schema({
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
        required: true
    },
    title: {
        type: String
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    pointsGets: {
        type: Number,
        default: 0
    }
}, { _id: false });

const buyingSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest"
    },
    guestName: {
        type: String
    },
    guestPhone: {
        type: String
    },
    tickets: [buyingTicketItemSchema],
    packages: [buyingPackageItemSchema],
    totalPrice: {
        type: Number,
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "card", "instapay", "vodafone_cash", "points"],
        default: "cash"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    paymentProof: {
        type: String
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "confirmed"
    },
    used: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Buying", buyingSchema);
