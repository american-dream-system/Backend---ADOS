const mongoose = require("mongoose");

const tripBookingSchema = new mongoose.Schema({
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
    // Organization / School Details
    orgName: {
        type: String,
        required: [true, "اسم المنظمة أو المدرسة مطلوب"],
        trim: true
    },
    orgType: {
        type: String,
        enum: ["School", "Nursery", "Daycare", "Youth Club", "Other", "مدرسة", "حضانة", "مركز رعاية", "نادي شباب", "أخرى"],
        default: "School"
    },
    contactName: {
        type: String,
        required: [true, "اسم منسق الرحلة مطلوب"],
        trim: true
    },
    phone: {
        type: String,
        required: [true, "رقم الهاتف / الواتساب مطلوب"],
        trim: true
    },

    // Selected Offer / Package
    offerId: {
        type: String,
        enum: ["full-dream", "play-dine", "play-zone", "custom"],
        default: "full-dream"
    },
    offerTitle: {
        type: String,
        default: "FULL DREAM DAY"
    },
    pricePerStudent: {
        type: Number,
        required: true,
        min: 0
    },

    // Group Numbers & Age Groups
    studentsCount: {
        type: Number,
        required: [true, "عدد الطلاب مطلوب"],
        min: [15, "الحد الأدنى للطلاب هو 15 طالباً"]
    },
    supervisorsCount: {
        type: Number,
        default: 1,
        min: 1
    },
    isSupervisorsManual: {
        type: Boolean,
        default: false
    },
    ageGroups: {
        type: [String],
        default: ["6-9", "10-12"]
    },

    // Schedule & Timing
    tripDate: {
        type: Date,
        required: [true, "تاريخ الرحلة مطلوب"]
    },
    shift: {
        type: String,
        enum: ["morning", "evening"],
        default: "morning"
    },
    arrivalTime: {
        type: String,
        default: "09:30 AM"
    },

    // Financial Calculation
    totalPrice: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "EGP"
    },

    // Quotation Image & Extra Info
    quotationScreenshot: {
        type: String,
        default: ""
    },
    notes: {
        type: String,
        default: ""
    },

    // Booking Status
    status: {
        type: String,
        enum: ["quote_generated", "inquiry", "pending", "confirmed", "completed", "cancelled"],
        default: "quote_generated"
    }
}, { timestamps: true });

// Indexing for search & queries
tripBookingSchema.index({ bookingCode: 1 });
tripBookingSchema.index({ tripDate: 1, shift: 1 });
tripBookingSchema.index({ phone: 1 });

const TripBooking = mongoose.model("TripBooking", tripBookingSchema);
module.exports = TripBooking;
