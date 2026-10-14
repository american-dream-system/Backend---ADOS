const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: [
            "playzone_order",
            "restaurant_order",
            "trip_booking",
            "event_booking",
            "table_booking",
            "system"
        ],
        default: "playzone_order"
    },
    orderCode: {
        type: String,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "orderModelRef"
    },
    orderModelRef: {
        type: String,
        enum: ["Buying", "MenuOrder", "BookingTable", "Trip", "Event"]
    },
    customerName: {
        type: String,
        default: "عميل"
    },
    customerPhone: {
        type: String,
        default: ""
    },
    amount: {
        type: Number,
        default: 0
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for fast sorting by latest notifications
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
