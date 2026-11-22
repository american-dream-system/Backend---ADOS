const EventsHome = require("./model");
const { normalizeImagePath } = require("../../utils/mediaPath");
const { mediaUrl, removeMediaFile } = require("../../utils/mediaFiles");

// hero + one cover per event type + one photo per Birthday Packages venue (ids match the three cards of the page: birthdays, occasions = family events, meetings)
const SLOTS = ["hero", "birthdays", "occasions", "meetings", "venueIndoor", "venueRooftop", "venueOutdoor"];
const MAX_GALLERY = 24;

const getDoc = async () => {
    let doc = await EventsHome.findOne({ key: "events-home" });
    if (!doc) {
        try {
            doc = await EventsHome.create({ key: "events-home" });
        } catch (e) {
            doc = await EventsHome.findOne({ key: "events-home" }); // lost a creation race
            if (!doc) throw e;
        }
    }
    return doc;
};

const imageUrl = mediaUrl;

const TIERS = ["midweek", "weekend"];
const MAX_INCLUDE_LINES = 20;
const MAX_LINE_LENGTH = 120;

const serializeTier = (t) => ({
    price: t && Number.isFinite(t.price) && t.price > 0 ? t.price : null,
    includesEn: (t && t.includesEn ? [...t.includesEn] : []).filter(Boolean),
    includesAr: (t && t.includesAr ? [...t.includesAr] : []).filter(Boolean),
});

const serialize = (doc) => {
    const images = {};
    SLOTS.forEach((s) => {
        images[s] = imageUrl(doc.images && doc.images[s]);
    });
    return {
        images,
        gallery: (doc.gallery || []).map((g) => ({ id: String(g._id), image: imageUrl(g.image) })),
        birthdayPerPerson: {
            midweek: serializeTier(doc.birthdayPerPerson && doc.birthdayPerPerson.midweek),
            weekend: serializeTier(doc.birthdayPerPerson && doc.birthdayPerPerson.weekend),
        },
    };
};

const send = (res, doc) => res.status(200).json({ success: true, data: serialize(doc) });

// @route GET /api/events-home   (public)
const getEventsHome = async (req, res, next) => {
    try {
        send(res, await getDoc());
    } catch (error) {
        next(error);
    }
};

// @route PUT|DELETE /api/events-home/images/:slot   (admin; DELETE = remove the image)
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


// Files uploaded by a request that failed: remove them
const discardUploads = (req) => {
    const list = Array.isArray(req.body && req.body.images) ? req.body.images : [];
    list.forEach(removeMediaFile);
    if (req.body && req.body.image) removeMediaFile(req.body.image);
};

// @route POST /api/events-home/gallery   (admin, multipart field "images", up to 10 files; appended in order)
const addGalleryImages = async (req, res, next) => {
    const uploaded = Array.isArray(req.body && req.body.images) ? req.body.images : [];
    try {
        if (!uploaded.length) {
            return res.status(400).json({ success: false, message: "Image files are required (field: images)" });
        }
        const doc = await getDoc();
        if (doc.gallery.length + uploaded.length > MAX_GALLERY) {
            discardUploads(req);
            return res.status(400).json({ success: false, message: `The gallery can hold at most ${MAX_GALLERY} images` });
        }
        uploaded.forEach((name) => doc.gallery.push({ image: normalizeImagePath(name) }));
        await doc.save();
        send(res, doc);
    } catch (error) {
        discardUploads(req);
        next(error);
    }
};

// @route PUT /api/events-home/gallery/:id   (admin, multipart field "image": replaces that image, keeps its place)
const replaceGalleryImage = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        if (!uploaded) {
            return res.status(400).json({ success: false, message: "Image file is required (field: image)" });
        }
        const doc = await getDoc();
        const item = doc.gallery.id(req.params.id);
        if (!item) {
            removeMediaFile(uploaded);
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }
        const old = item.image;
        item.image = normalizeImagePath(uploaded);
        await doc.save();
        if (old && old !== item.image) removeMediaFile(old);
        send(res, doc);
    } catch (error) {
        removeMediaFile(uploaded);
        next(error);
    }
};

// @route DELETE /api/events-home/gallery/:id   (admin)
const removeGalleryImage = async (req, res, next) => {
    try {
        const doc = await getDoc();
        const item = doc.gallery.id(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Gallery image not found" });
        const old = item.image;
        item.deleteOne();
        await doc.save();
        removeMediaFile(old);
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/events-home/gallery/order   (admin) body: { ids: [every gallery image id, in the new order] }
const reorderGallery = async (req, res, next) => {
    try {
        const ids = req.body && req.body.ids;
        const doc = await getDoc();
        const current = doc.gallery.map((g) => String(g._id));
        const valid =
            Array.isArray(ids) &&
            ids.length === current.length &&
            new Set(ids.map(String)).size === ids.length &&
            ids.every((id) => current.includes(String(id)));
        if (!valid) {
            return res.status(400).json({ success: false, message: "ids must list every gallery image exactly once" });
        }
        const byId = new Map(doc.gallery.map((g) => [String(g._id), g]));
        doc.gallery = ids.map((id) => byId.get(String(id)));
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

// Validates one list of plain-text lines: trimmed, blanks dropped. Returns an array or null when invalid.
const cleanLines = (list) => {
    if (list === undefined || list === null) return [];
    if (!Array.isArray(list)) return null;
    const out = [];
    for (const line of list) {
        if (typeof line !== "string") return null;
        const text = line.trim();
        if (!text) continue;
        if (text.length > MAX_LINE_LENGTH) return null;
        out.push(text);
    }
    return out.length > MAX_INCLUDE_LINES ? null : out;
};

// @route PUT /api/events-home/birthday-per-person   (admin)
// body: { midweek: { price, includesEn: [text], includesAr: [text] }, weekend: { ... } }  (price null/"" = not set)
const setBirthdayPerPerson = async (req, res, next) => {
    try {
        const body = req.body || {};
        const next_ = {};
        for (const tier of TIERS) {
            const t = body[tier];
            if (!t || typeof t !== "object") {
                return res.status(400).json({ success: false, message: `${tier} is required` });
            }
            let price = null;
            if (t.price !== null && t.price !== undefined && String(t.price).trim() !== "") {
                price = Number(t.price);
                if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
                    return res.status(400).json({ success: false, message: `${tier} price must be a number above 0` });
                }
                price = Math.round(price * 100) / 100;
            }
            const includesEn = cleanLines(t.includesEn);
            const includesAr = cleanLines(t.includesAr);
            if (!includesEn || !includesAr) {
                return res.status(400).json({
                    success: false,
                    message: `${tier}: include lines must be text (up to ${MAX_LINE_LENGTH} characters, at most ${MAX_INCLUDE_LINES} lines)`,
                });
            }
            next_[tier] = { price, includesEn, includesAr };
        }
        const doc = await getDoc();
        doc.birthdayPerPerson = next_;
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEventsHome,
    setBirthdayPerPerson,
    setImage,
    addGalleryImages,
    replaceGalleryImage,
    removeGalleryImage,
    reorderGallery,
};
