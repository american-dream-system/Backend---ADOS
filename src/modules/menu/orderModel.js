const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem"
    },
    nameEn: {
        type: String,
        required: true,
        trim: true
    },
    nameAr: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    lineTotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const menuOrderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        trim: true
    },
    customerPhone: {
        type: String,
        trim: true
    },
    deliveryAddress: {
        type: String,
        trim: true
    },
    deliveryNotes: {
        type: String,
        trim: true
    },
    orderType: {
        type: String,
        enum: ["delivery", "dine_in", "takeaway", "quick_order"],
        default: "delivery"
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: "قائمة الأصناف يجب أن تحتوي على صنف واحد على الأقل"
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryFee: {
        type: Number,
        default: 0,
        min: 0
    },
    vatAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "cash", "card", "instapay", "vodafone_cash"],
        default: "cod"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("MenuOrder", menuOrderSchema);
