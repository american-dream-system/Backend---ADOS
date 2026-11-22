const mongoose = require("mongoose");

// A booking request made from the Birthday, Family or Meetings wizard. Same pattern as table bookings: a server
// generated code, the customer's contact details, a status the admin changes (with an optional rejection reason),
// and a snapshot of what was priced at booking time. The price is always worked out on the server from the admin
// data; meetings have no fixed price and are saved as "price on request".
const snapshotSchema = new mongoose.Schema(
    {
        packageId: { type: String, default: "" },
        packageNameAr: { type: String, default: "" },
        packageNameEn: { type: String, default: "" },
        // Per-person booking (Birthday): the Midweek or Weekend tier and its price at the time of booking
        tier: { type: String, enum: ["midweek", "weekend", ""], default: "" },
        pricePerGuest: { type: Number, default: null },
        includesAr: { type: [String], default: [] },
        includesEn: { type: [String], default: [] },
    },
    { _id: false }
);

const eventRequestSchema = new mongoose.Schema(
    {
        bookingCode: { type: String, unique: true, required: true },
        kind: { type: String, enum: ["birthday", "family", "meeting"], required: true },
        // The signed-in customer, when there was one (requests are also matched to a customer by phone)
        guest: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", default: null },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled", "rejected"],
            default: "pending",
        },
        // Optional reason the admin gives when rejecting a request
        rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },

        customerName: { type: String, required: true, trim: true, maxlength: 100 },
        customerPhone: { type: String, required: true, trim: true },
        customerEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },

        eventDate: { type: Date, required: true },
        timeText: { type: String, trim: true, maxlength: 60, default: "" },
        guestCount: { type: Number, min: 1, default: null },
        notes: { type: String, trim: true, maxlength: 1000, default: "" },

        // What was asked for (venue, occasion type, celebrant or organization)
        // Family Events / Meetings: the venue or space picked from the admin list (id, and its name in both languages at the time)
        venueId: { type: String, trim: true, maxlength: 40, default: "" },
        venue: { type: String, trim: true, maxlength: 80, default: "" },
        venueAr: { type: String, trim: true, maxlength: 80, default: "" },
        occasion: { type: String, trim: true, maxlength: 80, default: "" },
        organizer: { type: String, trim: true, maxlength: 120, default: "" },
        equipment: { type: [String], default: [] },
        equipmentAr: { type: [String], default: [] },

        // Price: "package", "per_person" or "on_request" (meetings). On request means no price at all (null), never 0.
        priceMode: { type: String, enum: ["package", "per_person", "on_request"], required: true },
        totalPrice: { type: Number, default: null },
        snapshot: { type: snapshotSchema, default: () => ({}) },
        lang: { type: String, enum: ["ar", "en"], default: "ar" },
    },
    { timestamps: true }
);

eventRequestSchema.index({ status: 1, createdAt: -1 });

const EventRequest = mongoose.model("EventRequest", eventRequestSchema);

// Phones are stored in the local form (01XXXXXXXXX) so a customer is found whichever form they typed (+20..., 20..., 01...)
EventRequest.normalizePhone = (value) => {
    const digits = String(value || "").replace(/[^\d+]/g, "");
    return digits.replace(/^\+?20(?=1[0125]\d{8}$)/, "0");
};

module.exports = EventRequest;
