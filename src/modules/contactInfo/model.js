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
        // Opening Hours page cards (Winter, Summer, Breakfast): title, hours and days typed freely in both languages
        winterTitleEn: { type: String, default: "" },
        winterTitleAr: { type: String, default: "" },
        winterHoursEn: { type: String, default: "" },
        winterHoursAr: { type: String, default: "" },
        winterDaysEn: { type: String, default: "" },
        winterDaysAr: { type: String, default: "" },
        summerTitleEn: { type: String, default: "" },
        summerTitleAr: { type: String, default: "" },
        summerHoursEn: { type: String, default: "" },
        summerHoursAr: { type: String, default: "" },
        summerDaysEn: { type: String, default: "" },
        summerDaysAr: { type: String, default: "" },
        breakfastTitleEn: { type: String, default: "" },
        breakfastTitleAr: { type: String, default: "" },
        breakfastHoursEn: { type: String, default: "" },
        breakfastHoursAr: { type: String, default: "" },
        breakfastDaysEn: { type: String, default: "" },
        breakfastDaysAr: { type: String, default: "" },
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
