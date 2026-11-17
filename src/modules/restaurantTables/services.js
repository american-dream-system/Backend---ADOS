const mongoose = require("mongoose");
const { Table, Category, Meta } = require("./model");
const BookingTable = require("../bookingTable/model");
const { normalizeImagePath } = require("../../utils/mediaPath");
const { mediaUrl, removeMediaFile } = require("../../utils/mediaFiles");

const MAX_NAME = 80;
const MAX_CATEGORY_NAME = 40;
const MAX_TABLES = 60;
const MAX_CATEGORIES = 30;
// A booking is "open" until the guest was seated and left (completed), or it was cancelled or rejected
const OPEN_BOOKING_STATUSES = ["pending", "confirmed"];

// The tables and categories that existed before they became editable (same names, photos and areas)
const DEFAULT_CATEGORIES = [
    { key: "indoor", nameEn: "Indoor", nameAr: "داخلي", kind: "indoor" },
    { key: "outdoor", nameEn: "Outdoor", nameAr: "خارجي", kind: "outdoor" },
    { key: "smoking", nameEn: "Smoking", nameAr: "مسموح بالتدخين", kind: "smoking" },
    { key: "non-smoking", nameEn: "Non-smoking", nameAr: "غير مسموح بالتدخين", kind: "non-smoking" },
    { key: "families", nameEn: "Families", nameAr: "عائلات", kind: "families" },
];

const DEFAULT_TABLES = [
    { nameEn: "Family 1", nameAr: "عائلية 1", smoking: "non-smoking", areaValue: "Family 1", cats: ["outdoor", "families"], image: "/photo/kid-area-pic/Canal-side sunset dinner terrace with warm string lights, dining tables, grilled meats, salads, and sparkling water.png" },
    { nameEn: "Family 2", nameAr: "عائلية 2", smoking: "non-smoking", areaValue: "Family 2", cats: ["outdoor", "families"], image: "/photo/kid-area-pic/roof_photo_3.png" },
    { nameEn: "Family 3", nameAr: "عائلية 3", smoking: "non-smoking", areaValue: "Family 3", cats: ["outdoor", "families"], image: "/photo/kid-area-pic/roof_photo_4.png" },
    { nameEn: "Relaxation Area", nameAr: "منطقة الاسترخاء", smoking: "smoking", areaValue: "Relaxation Area", cats: ["outdoor"], image: "/photo/kid-area-pic/roof_photo_1.png" },
    { nameEn: "Roof", nameAr: "الرووف", smoking: "smoking", areaValue: "Roof", cats: ["outdoor"], image: "/photo/kid-area-pic/roof_photo_2.png" },
    { nameEn: "In door VIP", nameAr: "داخلي VIP", smoking: "non-smoking", areaValue: "VIP Area", cats: ["indoor"], image: "/photo/kid-area-pic/Item 2_ Vertical Dining & Floral Setup.png" },
];

// Creates the original categories and tables once. Concurrent first requests are safe: only the request that
// flips `seeded` from false to true inserts them.
let seeding = null;
const ensureSeeded = async () => {
    if (!seeding) {
        seeding = (async () => {
            try {
                await Meta.updateOne({ key: "restaurant-tables" }, { $setOnInsert: { seeded: false } }, { upsert: true });
            } catch (e) {
                if (e.code !== 11000) throw e;
            }
            const won = await Meta.findOneAndUpdate({ key: "restaurant-tables", seeded: false }, { seeded: true });
            if (!won) return;
            const cats = await Category.insertMany(
                DEFAULT_CATEGORIES.map((c, i) => ({ nameEn: c.nameEn, nameAr: c.nameAr, kind: c.kind, order: i }))
            );
            const byKey = {};
            DEFAULT_CATEGORIES.forEach((c, i) => { byKey[c.key] = cats[i]._id; });
            await Table.insertMany(
                DEFAULT_TABLES.map((t, i) => ({
                    nameEn: t.nameEn,
                    nameAr: t.nameAr,
                    smoking: t.smoking,
                    areaValue: t.areaValue,
                    image: t.image,
                    categories: t.cats.map((k) => byKey[k]),
                    order: i,
                }))
            );
        })().finally(() => { seeding = null; });
    }
    return seeding;
};

const serializeCategory = (c) => ({ id: String(c._id), nameEn: c.nameEn, nameAr: c.nameAr, kind: c.kind || "" });
const serializeTable = (t) => ({
    id: String(t._id),
    nameEn: t.nameEn,
    nameAr: t.nameAr,
    image: mediaUrl(t.image),
    smoking: t.smoking,
    categoryIds: (t.categories || []).map(String),
    areaValue: t.areaValue || "",
});

const loadAll = async () => {
    await ensureSeeded();
    const [categories, tables] = await Promise.all([
        Category.find().sort({ order: 1, createdAt: 1 }),
        Table.find().sort({ order: 1, createdAt: 1 }),
    ]);
    return { categories: categories.map(serializeCategory), tables: tables.map(serializeTable) };
};

const sendAll = async (res, status = 200) => res.status(status).json({ success: true, data: await loadAll() });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// @route GET /api/restaurant-tables   (public)
const getAll = async (req, res, next) => {
    try {
        await sendAll(res);
    } catch (error) {
        next(error);
    }
};

// ---- tables -------------------------------------------------------------------------------------------------

const parseIds = (raw) => {
    if (raw === undefined) return undefined;
    let list = raw;
    if (typeof raw === "string") {
        try { list = JSON.parse(raw); } catch (e) { return null; }
    }
    if (!Array.isArray(list)) return null;
    return [...new Set(list.map(String))];
};

// Validates the fields of a table form. Returns { error } or { values } (only the fields that were sent).
const readTable = async (body, { creating }) => {
    const values = {};
    for (const [field, label] of [["nameEn", "English name"], ["nameAr", "Arabic name"]]) {
        if (body[field] === undefined) {
            if (creating) return { error: `${label} is required` };
            continue;
        }
        const v = String(body[field]).trim();
        if (!v) return { error: `${label} is required` };
        if (v.length > MAX_NAME) return { error: `${label} must be at most ${MAX_NAME} characters` };
        values[field] = v;
    }
    if (body.smoking === undefined) {
        if (creating) return { error: "Smoking status is required (smoking or non-smoking)" };
    } else if (!["smoking", "non-smoking"].includes(body.smoking)) {
        return { error: "Smoking status must be smoking or non-smoking" };
    } else {
        values.smoking = body.smoking;
    }
    const ids = parseIds(body.categories);
    if (ids === null) return { error: "categories must be a list of category ids" };
    if (ids !== undefined) {
        if (!ids.every((id) => mongoose.isValidObjectId(id))) return { error: "Unknown category" };
        const found = await Category.find({ _id: { $in: ids } });
        if (found.length !== ids.length) return { error: "Unknown category" };
        if (found.some((c) => c.kind === "smoking" || c.kind === "non-smoking")) {
            return { error: "Smoking and Non-smoking come from the smoking status, not from the categories" };
        }
        if (found.some((c) => c.kind === "indoor") && found.some((c) => c.kind === "outdoor")) {
            return { error: "A table cannot be both Indoor and Outdoor" };
        }
        values.categories = ids;
    }
    return { values };
};

// @route POST /api/restaurant-tables   (admin, multipart: nameEn, nameAr, smoking, categories (JSON list), image)
const createTable = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        await ensureSeeded();
        const { error, values } = await readTable(req.body || {}, { creating: true });
        if (error) { removeMediaFile(uploaded); return fail(res, 400, error); }
        if (!uploaded) return fail(res, 400, "A photo is required (field: image)");
        if ((await Table.countDocuments()) >= MAX_TABLES) {
            removeMediaFile(uploaded);
            return fail(res, 400, `At most ${MAX_TABLES} tables are allowed`);
        }
        const last = await Table.findOne().sort({ order: -1 });
        await Table.create({ ...values, image: normalizeImagePath(uploaded), order: last ? last.order + 1 : 0 });
        await sendAll(res, 201);
    } catch (error) {
        removeMediaFile(uploaded);
        next(error);
    }
};

// @route PUT /api/restaurant-tables/:id   (admin, same fields; every field optional, a new photo replaces the old one)
const updateTable = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        if (!mongoose.isValidObjectId(req.params.id)) { removeMediaFile(uploaded); return fail(res, 404, "Table not found"); }
        const table = await Table.findById(req.params.id);
        if (!table) { removeMediaFile(uploaded); return fail(res, 404, "Table not found"); }
        const { error, values } = await readTable(req.body || {}, { creating: false });
        if (error) { removeMediaFile(uploaded); return fail(res, 400, error); }
        const oldImage = table.image;
        Object.assign(table, values);
        if (uploaded) table.image = normalizeImagePath(uploaded);
        await table.save();
        if (uploaded && oldImage && oldImage !== table.image) removeMediaFile(oldImage);
        await sendAll(res);
    } catch (error) {
        removeMediaFile(uploaded);
        next(error);
    }
};

// Bookings of a table that are not finished (no matching booking = it can be deleted). Bookings made before tables
// were managed carry only the area value, so those are matched by it.
const openBookingsFilter = (table) => ({
    status: { $in: OPEN_BOOKING_STATUSES },
    $or: [{ tableId: table._id }, ...(table.areaValue ? [{ tableId: null, area: table.areaValue }] : [])],
});

// @route DELETE /api/restaurant-tables/:id   (admin; refused while the table has an open booking)
const deleteTable = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Table not found");
        const table = await Table.findById(req.params.id);
        if (!table) return fail(res, 404, "Table not found");
        const open = await BookingTable.countDocuments(openBookingsFilter(table));
        if (open > 0) {
            return fail(
                res,
                409,
                `This table cannot be deleted: it has ${open} open booking${open === 1 ? "" : "s"} (pending or confirmed). ` +
                    "A table can be deleted only when all its bookings are completed, cancelled or rejected."
            );
        }
        // Finished bookings keep the name the table had
        await BookingTable.updateMany(
            { $or: [{ tableId: table._id }, ...(table.areaValue ? [{ tableId: null, area: table.areaValue }] : [])], tableNameEn: "" },
            { $set: { tableNameEn: table.nameEn, tableNameAr: table.nameAr } }
        );
        await table.deleteOne();
        removeMediaFile(table.image);
        await sendAll(res);
    } catch (error) {
        next(error);
    }
};

// ---- categories ---------------------------------------------------------------------------------------------

const readCategoryNames = (body) => {
    const out = {};
    for (const [field, label] of [["nameEn", "English name"], ["nameAr", "Arabic name"]]) {
        const v = String((body && body[field]) || "").trim();
        if (!v) return { error: `${label} is required` };
        if (v.length > MAX_CATEGORY_NAME) return { error: `${label} must be at most ${MAX_CATEGORY_NAME} characters` };
        out[field] = v;
    }
    return { values: out };
};

// @route POST /api/restaurant-tables/categories   (admin)
const createCategory = async (req, res, next) => {
    try {
        await ensureSeeded();
        const { error, values } = readCategoryNames(req.body);
        if (error) return fail(res, 400, error);
        if ((await Category.countDocuments()) >= MAX_CATEGORIES) return fail(res, 400, `At most ${MAX_CATEGORIES} categories are allowed`);
        const last = await Category.findOne().sort({ order: -1 });
        await Category.create({ ...values, kind: "", order: last ? last.order + 1 : 0 });
        await sendAll(res, 201);
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/restaurant-tables/categories/:id   (admin; renames in both languages)
const renameCategory = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Category not found");
        const { error, values } = readCategoryNames(req.body);
        if (error) return fail(res, 400, error);
        const cat = await Category.findByIdAndUpdate(req.params.id, values, { new: true });
        if (!cat) return fail(res, 404, "Category not found");
        await sendAll(res);
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/restaurant-tables/categories/order   (admin) body: { ids: [every category id, in the new order] }
const reorderCategories = async (req, res, next) => {
    try {
        await ensureSeeded();
        const ids = req.body && req.body.ids;
        const current = (await Category.find().select("_id")).map((c) => String(c._id));
        const valid =
            Array.isArray(ids) &&
            ids.length === current.length &&
            new Set(ids.map(String)).size === ids.length &&
            ids.every((id) => current.includes(String(id)));
        if (!valid) return fail(res, 400, "ids must list every category exactly once");
        await Category.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
        await sendAll(res);
    } catch (error) {
        next(error);
    }
};

// @route DELETE /api/restaurant-tables/categories/:id   (admin; tables just lose the category)
const deleteCategory = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Category not found");
        const cat = await Category.findByIdAndDelete(req.params.id);
        if (!cat) return fail(res, 404, "Category not found");
        await Table.updateMany({ categories: cat._id }, { $pull: { categories: cat._id } });
        await sendAll(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    createTable,
    updateTable,
    deleteTable,
    createCategory,
    renameCategory,
    reorderCategories,
    deleteCategory,
};
