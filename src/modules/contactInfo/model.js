const mongoose = require("mongoose");

// The venue's contact details, one document edited from the admin "Contact Info" page. Every field is optional and
// there are no built-in values: an empty string means "not set", and the site hides whatever is not set.
const contactInfoSchema = new mongoose.Schema(
    {
        key: { type: String, default: "contact-info", unique: true },
        phone: { type: String, default: "" },
        whatsapp: { type: String, default: "" },
        hotline: { type: String, default: "" },
        hoursEn: { type: String, default: "" },
        hoursAr: { type: String, default: "" },
        addressEn: { type: String, default: "" },
        addressAr: { type: String, default: "" },
        mapUrl: { type: String, default: "" },
        facebookUrl: { type: String, default: "" },
        instagramUrl: { type: String, default: "" },
        youtubeUrl: { type: String, default: "" },
        tiktokUrl: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
