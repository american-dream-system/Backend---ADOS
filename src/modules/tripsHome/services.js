const TripsHome = require("./model");
const { normalizeImagePath } = require("../../utils/mediaPath");
const { mediaUrl, removeMediaFile } = require("../../utils/mediaFiles");

// hero = banner at the top of the trip form, success = photo on the booking confirmation (and the cart thumbnail)
const SLOTS = ["hero", "success"];

const getDoc = async () => {
    let doc = await TripsHome.findOne({ key: "trips-home" });
    if (!doc) {
        try {
            doc = await TripsHome.create({ key: "trips-home" });
        } catch (e) {
            doc = await TripsHome.findOne({ key: "trips-home" }); // lost a creation race
            if (!doc) throw e;
        }
    }
    return doc;
};

const serialize = (doc) => {
    const images = {};
    SLOTS.forEach((s) => {
        images[s] = mediaUrl(doc.images && doc.images[s]);
    });
    return { images };
};

const send = (res, doc) => res.status(200).json({ success: true, data: serialize(doc) });

// @route GET /api/trips-home   (public)
const getTripsHome = async (req, res, next) => {
    try {
        send(res, await getDoc());
    } catch (error) {
        next(error);
    }
};

// @route PUT|DELETE /api/trips-home/images/:slot   (admin; DELETE = remove the image)
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

module.exports = { getTripsHome, setImage, SLOTS };
