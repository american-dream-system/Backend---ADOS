const fs = require("fs");
const path = require("path");
const RestaurantHome = require("./model");
const { normalizeImagePath } = require("../../utils/mediaPath");

const SLOTS = ["hero", "book-table", "delivery", "menu"];
const CARD_SLOTS = ["book-table", "delivery", "menu"];
const MAX_CHIP = 40;
const MAX_TITLE = 80;
const MAX_TEXT = 240;
const MEDIA_DIR = path.resolve("upload/media");

const getDoc = async () => {
    let doc = await RestaurantHome.findOne({ key: "restaurant-home" });
    if (!doc) {
        try {
            doc = await RestaurantHome.create({ key: "restaurant-home" });
        } catch (e) {
            doc = await RestaurantHome.findOne({ key: "restaurant-home" }); // lost a creation race
            if (!doc) throw e;
        }
    }
    return doc;
};

const imageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const v = value.trim();
    if (/^(https?:|data:|blob:|\/photo\/|\/assets\/)/.test(v)) return v;
    const name = v.replace(/^\/+/, "").replace(/^media\//, "");
    return `${process.env.BASE_URL || ""}/media/${name}`;
};

// Removes an uploaded file that is no longer referenced. Only bare names inside upload/media.
const removeMediaFile = (stored) => {
    if (!stored || typeof stored !== "string") return;
    const name = stored.trim().replace(/^\/+/, "").replace(/^media\//, "");
    if (!/^[A-Za-z0-9_.-]+$/.test(name) || name.startsWith(".")) return;
    const full = path.resolve(MEDIA_DIR, name);
    if (path.dirname(full) !== MEDIA_DIR) return;
    fs.unlink(full, () => {});
};

const txt = (t) => ({ en: (t && t.en) || "", ar: (t && t.ar) || "" });

const serialize = (doc) => {
    const images = {};
    const cards = {};
    SLOTS.forEach((s) => {
        images[s] = imageUrl(doc.images && doc.images[s]);
    });
    CARD_SLOTS.forEach((s) => {
        const c = (doc.cards && doc.cards[s]) || {};
        cards[s] = { title: txt(c.title), description: txt(c.description) };
    });
    return {
        images,
        heroChip: txt(doc.heroChip),
        heroTitle: txt(doc.heroTitle),
        heroSubtitle: txt(doc.heroSubtitle),
        cards,
    };
};

const send = (res, doc) => res.status(200).json({ success: true, data: serialize(doc) });

// @route GET /api/restaurant-home   (public)
const getRestaurantHome = async (req, res, next) => {
    try {
        send(res, await getDoc());
    } catch (error) {
        next(error);
    }
};

// @route PUT|DELETE /api/restaurant-home/images/:slot   (admin; DELETE = back to the default image)
const setImage = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        const slot = req.params.slot;
        if (!SLOTS.includes(slot)) {
            removeMediaFile(uploaded);
            return res.status(400).json({ success: false, message: "Invalid image slot" });
        }
        const clear = req.method === "DELETE";
        if (!clear && !uploaded) {
            return res.status(400).json({ success: false, message: "Image file is required (field: image)" });
        }
        const doc = await getDoc();
        const old = doc.images[slot];
        doc.images[slot] = clear ? "" : normalizeImagePath(uploaded);
        await doc.save();
        if (old && old !== doc.images[slot]) removeMediaFile(old);
        send(res, doc);
    } catch (error) {
        removeMediaFile(uploaded);
        next(error);
    }
};

// Reads { en, ar } from the body. undefined = not sent, null = invalid, object = value
const readText = (raw, max) => {
    if (raw === undefined) return undefined;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
    const out = {};
    for (const lang of ["en", "ar"]) {
        const v = raw[lang];
        if (v !== undefined && typeof v !== "string") return null;
        out[lang] = String(v || "").trim();
        if (out[lang].length > max) return null;
    }
    return out;
};

// @route PUT /api/restaurant-home/texts   (admin)
// body: { heroChip, heroTitle, heroSubtitle, cards: { "book-table"|"delivery"|"menu": { title, description } } }
// every text is { en, ar }; a field that is not sent is left alone; both empty = back to the default
const setTexts = async (req, res, next) => {
    try {
        const body = req.body || {};
        const bad = (what) => res.status(400).json({ success: false, message: `Invalid ${what}` });
        const doc = await getDoc();

        for (const [field, max] of [["heroChip", MAX_CHIP], ["heroTitle", MAX_TITLE], ["heroSubtitle", MAX_TEXT]]) {
            const v = readText(body[field], max);
            if (v === null) return bad(`${field} (max ${max} characters per language)`);
            if (v !== undefined) doc[field] = v;
        }
        if (body.cards !== undefined) {
            if (!body.cards || typeof body.cards !== "object" || Array.isArray(body.cards)) return bad("cards");
            for (const slot of Object.keys(body.cards)) {
                if (!CARD_SLOTS.includes(slot)) return bad(`card slot "${slot}"`);
                const c = body.cards[slot] || {};
                const title = readText(c.title, MAX_TITLE);
                const description = readText(c.description, MAX_TEXT);
                if (title === null) return bad(`${slot} title (max ${MAX_TITLE} characters per language)`);
                if (description === null) return bad(`${slot} description (max ${MAX_TEXT} characters per language)`);
                if (title !== undefined) doc.cards[slot].title = title;
                if (description !== undefined) doc.cards[slot].description = description;
            }
        }
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

module.exports = { getRestaurantHome, setImage, setTexts };
