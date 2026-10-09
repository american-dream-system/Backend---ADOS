const mongoose = require("mongoose");

const eventBookingSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        uppercase: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest"
    },
    contactName: {
        type: String,
        required: [true, "اسم العميل / منظم الحفل مطلوب"],
        trim: true
    },
    contactPhone: {
        type: String,
        required: [true, "رقم الهاتف مطلوب للتواصل وتأكيد الحجز"],
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true
    },

    // Occasion / Event Classification
    eventType: {
        type: String,
        enum: ["birthday", "family", "general_hall", "corporate", "other"],
        default: "birthday"
    },
    title: {
        type: String,
        default: "Event Celebration"
    },

    // Venue Space ("Hole" / Hall Area)
    space: {
        type: String,
        enum: ["indoor", "roof", "outdoor", "grand_ballroom"],
        required: [true, "مكان أو قاعة الحفل مطلوبة (indoor / roof / outdoor / grand_ballroom)"]
    },
    spaceTitle: {
        type: String,
        default: "Indoor Hall"
    },

    // Birthday-specific options
    birthdayDetails: {
        celebrantName: { type: String, default: "" },
        celebrantAge: { type: String, default: "" },
        packageId: {
            type: String,
            enum: ["explorer", "champion", "vip", "custom", "none"],
            default: "champion"
        },
        packageName: { type: String, default: "Champion Quest" }
    },

    // Guests & Attendance
    totalGuests: {
        type: Number,
        required: [true, "إجمالي عدد الضيوف مطلوب"],
        min: [1, "عدد الضيوف يجب أن يكون 1 على الأقل"]
    },
    kidsCount: {
        type: Number,
        default: 0
    },
    adultsCount: {
        type: Number,
        default: 0
    },

    // Scheduling
    eventDate: {
        type: Date,
        required: [true, "تاريخ المناسبة مطلوب"]
    },
    session: {
        type: String,
        enum: ["morning", "afternoon", "evening", "full_day"],
        required: [true, "فترة المناسبة مطلوبة (morning, afternoon, evening)"]
    },
    sessionTime: {
        type: String,
        default: "04:00 PM – 07:30 PM"
    },

    // Financial Breakdown (Base + Venue Fee + 14% VAT)
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    venueFee: {
        type: Number,
        default: 0
    },
    vatRate: {
        type: Number,
        default: 0.14
    },
    vatAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    depositRequired: {
        type: Number,
        default: 0
    },
    depositPaid: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ["instapay", "vodafone_cash", "cash", "credit_card", "pending"],
        default: "pending"
    },
    paymentProof: {
        type: String,
        default: ""
    },

    // Operational Status
    status: {
        type: String,
        enum: ["pending_deposit", "deposit_verified", "confirmed", "in_progress", "completed", "cancelled"],
        default: "pending_deposit"
    },
    specialRequests: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// Indexes
eventBookingSchema.index({ bookingCode: 1 });
eventBookingSchema.index({ eventDate: 1, space: 1, session: 1 });
eventBookingSchema.index({ contactPhone: 1 });

const EventBooking = mongoose.model("EventBooking", eventBookingSchema);
module.exports = EventBooking;
