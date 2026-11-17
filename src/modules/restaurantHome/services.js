const RestaurantHome = require("./model");
const { normalizeImagePath } = require("../../utils/mediaPath");
const { mediaUrl, removeMediaFile } = require("../../utils/mediaFiles");

const SLOTS = ["hero", "book-table", "delivery", "menu", "table-hero"];
const MAX_GALLERY = 24;

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

const imageUrl = mediaUrl;

const serialize = (doc) => {
    const images = {};
    SLOTS.forEach((s) => {
        images[s] = imageUrl(doc.images && doc.images[s]);
    });
    return {
        images,
        gallery: (doc.gallery || []).map((g) => ({ id: String(g._id), image: imageUrl(g.image) })),
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


// Files uploaded by a request that failed: remove them
const discardUploads = (req) => {
    const list = Array.isArray(req.body && req.body.images) ? req.body.images : [];
    list.forEach(removeMediaFile);
    if (req.body && req.body.image) removeMediaFile(req.body.image);
};

// @route POST /api/restaurant-home/gallery   (admin, multipart field "images", up to 10 files; appended in order)
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

// @route PUT /api/restaurant-home/gallery/:id   (admin, multipart field "image": replaces that image, keeps its place)
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

// @route DELETE /api/restaurant-home/gallery/:id   (admin)
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

// @route PUT /api/restaurant-home/gallery/order   (admin) body: { ids: [every gallery image id, in the new order] }
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

module.exports = {
    getRestaurantHome,
    setImage,
    addGalleryImages,
    replaceGalleryImage,
    removeGalleryImage,
    reorderGallery,
};
