const mongoose = require("mongoose");

// One document: which package categories the admin hid, and the extra categories they added.
// Before this lived only in each admin's browser (localStorage).
const customSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true },
        nameAr: { type: String, default: "", trim: true },
        nameEn: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const categorySettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "package-categories", unique: true },
        deleted: { type: [String], default: [] },
        custom: { type: [customSchema], default: [] },
    },
    { timestamps: true }
);

const CategorySettings = mongoose.model("PackageCategorySettings", categorySettingsSchema);

const getDoc = async () => {
    let doc = await CategorySettings.findOne({ key: "package-categories" });
    if (!doc) doc = await CategorySettings.create({ key: "package-categories" });
    return doc;
};

const serialize = (doc) => ({
    deleted: doc.deleted,
    custom: doc.custom.map((c) => ({ id: c.id, nameAr: c.nameAr, nameEn: c.nameEn })),
});

// @route GET /api/packages/category-settings  (public)
const getCategorySettings = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: serialize(await getDoc()) });
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/packages/category-settings  (admin)
const saveCategorySettings = async (req, res, next) => {
    try {
        const body = req.body || {};
        const deleted = Array.isArray(body.deleted)
            ? [...new Set(body.deleted.map((c) => String(c).trim().toLowerCase()).filter(Boolean))]
            : [];
        const custom = Array.isArray(body.custom)
            ? body.custom
                  .filter((c) => c && c.id)
                  .map((c) => ({
                      id: String(c.id).trim().toLowerCase(),
                      nameAr: String(c.nameAr || "").trim(),
                      nameEn: String(c.nameEn || "").trim(),
                  }))
            : [];
        const doc = await getDoc();
        doc.deleted = deleted;
        doc.custom = custom;
        await doc.save();
        res.status(200).json({ success: true, data: serialize(doc) });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCategorySettings, saveCategorySettings };
