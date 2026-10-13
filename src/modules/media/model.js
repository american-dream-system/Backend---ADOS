const mongoose = require("mongoose");

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
        image: { type: String, default: "" },
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
        images: { type: [String], default: [] },
        items: { type: [itemCardSchema], default: [] },
        extraData: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

mediaSchema.index({ page: 1, section: 1 });

// Helper to safely format image URL without duplicates
const formatImageUrl = (image) => {
    if (!image || typeof image !== "string") return image;
    const trimmed = image.trim();
    if (
        trimmed.startsWith("http://") || 
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:") ||
        trimmed.startsWith("/photo/") ||
        trimmed.startsWith("/assets/")
    ) {
        return trimmed;
    }
    const cleanImage = trimmed.replace(/^\/+/, "");
    const pureName = cleanImage.startsWith("media/") ? cleanImage.substring(6) : cleanImage;
    return `http://localhost:9500/media/${pureName}`;
};

const formatDoc = (doc) => {
    if (!doc) return;
    if (doc.images && Array.isArray(doc.images)) {
        doc.images = doc.images.map(formatImageUrl);
    }
    if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach((item) => {
            if (item && item.image) {
                item.image = formatImageUrl(item.image);
            }
        });
    }
};

// return image url 
mediaSchema.post("init", (doc) => {
    formatDoc(doc);
});

// modify find query 
mediaSchema.post(/^find/, function (docs) {
    if (!docs) return;
    if (Array.isArray(docs)) {
        docs.forEach(formatDoc);
    } else {
        formatDoc(docs);
    }
});

module.exports = mongoose.model("Media", mediaSchema);