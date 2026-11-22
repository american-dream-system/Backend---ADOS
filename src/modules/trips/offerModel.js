const mongoose = require("mongoose");

// A trip offer (package) edited from the admin "Trips Offers" page. There are no built-in offers: the public list is
// exactly what the admin has entered. Bookings are always priced on the server from the offer's price.
const tripOfferSchema = new mongoose.Schema(
    {
        titleEn: { type: String, required: true, trim: true, maxlength: 120 },
        titleAr: { type: String, required: true, trim: true, maxlength: 120 },
        inclusionsEn: { type: [String], default: [] },
        inclusionsAr: { type: [String], default: [] },
        price: { type: Number, required: true, min: 0 }, // EGP per student
        image: { type: String, default: "" }, // optional, stored file name
        // The server's trip rules, per offer: the smallest group, and one free supervisor for every N students
        minStudents: { type: Number, default: 15, min: 1 },
        studentsPerSupervisor: { type: Number, default: 15, min: 1 },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TripOffer", tripOfferSchema);