const mongoose = require("mongoose");
const { normalizeImagePath, toPublicUrl, normalizeOwnMediaUrlsDeep, publicizeExtraDataDeep } = require("../../utils/mediaPath");

const itemCardSchema = new mongoose.Schema(
    {
        slot: { type: String, trim: true }, // e.g., 'table_booking', 'digital_menu', 'delivery', 'slot_1'
        title: { type: String, default: "" },
        titleAr: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        subtitleAr: { type: String, default: "" },
        description: { type: String, default: "" },
        descriptionAr: { type: String, default: "" },
        badge: { type: String, default: "" },
        badgeAr: { type: String, default: "" },
        image: { type: String, default: "", set: normalizeImagePath },
        buttonText: { type: String, default: "" },
        buttonTextAr: { type: String, default: "" },
        actionType: { type: String, default: "" }, // 'modal' | 'link' | 'hash'
        actionTarget: { type: String, default: "" }, // e.g. 'booking', '#restaurant-delivery'
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { _id: true }
);

const mediaSchema = new mongoose.Schema(
    {
        page: { type: String, required: true, trim: true },
        section: { type: String, required: true, trim: true },
        name: { type: String, default: "" },
        title: { type: String, default: "" },
        titleAr: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        subtitleAr: { type: String, default: "" },
        description: { type: String, default: "" },
        descriptionAr: { type: String, default: "" },
        images: { type: [String], default: [], set: (arr) => (Array.isArray(arr) ? arr.map(normalizeImagePath) : arr) },
        items: { type: [itemCardSchema], default: [] },
        extraData: { type: mongoose.Schema.Types.Mixed, default: {}, set: normalizeOwnMediaUrlsDeep, publicizeExtraDataDeep },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

mediaSchema.index({ page: 1, section: 1 });

// The database stores only relative paths / bare file names (see utils/mediaPath.js).
// The full URL is built from BASE_URL when the document is serialised for a response.
const toPublicShape = (_doc, ret) => {
    if (Array.isArray(ret.images)) ret.images = ret.images.map(toPublicUrl);
    if (ret.extraData && typeof ret.extraData === "object") ret.extraData = publicizeExtraDataDeep(normalizeOwnMediaUrlsDeep(ret.extraData));
    if (Array.isArray(ret.items)) {
        ret.items.forEach((item) => {
            if (item && item.image) item.image = toPublicUrl(item.image);
        });
    }
    return ret;
};
mediaSchema.set("toJSON", { transform: toPublicShape });
mediaSchema.set("toObject", { transform: toPublicShape });

module.exports = mongoose.model("Media", mediaSchema);
