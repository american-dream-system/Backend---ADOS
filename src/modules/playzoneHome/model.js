const mongoose = require("mongoose");

// Single-document store for the editable parts of the Play Zone home page.
// An empty string means "not set by the admin": the frontend shows its static default.
const bulletSchema = new mongoose.Schema(
    {
        en: { type: String, default: "", trim: true },
        ar: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const packageSchema = new mongoose.Schema(
    {
        titleEn: { type: String, required: true, trim: true },
        titleAr: { type: String, default: "", trim: true },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, default: "" },
        bullets: { type: [bulletSchema], default: [] },
    },
    { _id: true }
);

const playzoneHomeSchema = new mongoose.Schema(
    {
        key: { type: String, default: "playzone-home", unique: true },
        heroImage: { type: String, default: "" },
        // Fixed order: kids-area, fun-park, challenge, adventure
        zoneImages: { type: [String], default: ["", "", "", ""] },
        // Fixed order like zoneImages: editable card description per zone (empty = static default)
        zoneDescriptions: { type: [bulletSchema], default: [] },
        // Four fixed slots
        activityImages: { type: [String], default: ["", "", "", ""] },
        packages: { type: [packageSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PlayzoneHome", playzoneHomeSchema);
