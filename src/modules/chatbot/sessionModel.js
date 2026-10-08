const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "model", "system"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    toolCalls: {
        type: Array,
        default: []
    },
    toolResults: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest",
        default: null
    },
    title: {
        type: String,
        default: "محادثة جديدة مع المساعد الذكي"
    },
    messages: {
        type: [chatMessageSchema],
        default: []
    },
    metadata: {
        guestName: String,
        guestPhone: String,
        lastInteractionAt: Date
    }
}, { timestamps: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
