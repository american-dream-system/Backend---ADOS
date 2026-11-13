const mongoose = require("mongoose");
const { protectGuest } = require("./authMiddleware");

const isAdmin = (req) => req.guest && req.guest.role === "admin";
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v) && String(v).length === 24;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Does this record belong to the logged-in guest? (by guest/user id or by the guest's phone)
const ownsDoc = (doc, guest, { guestFields = ["guest"], phoneFields = [] } = {}) => {
    const id = String(guest._id);
    for (const f of guestFields) {
        const v = doc[f];
        if (v && String(v._id || v) === id) return true;
    }
    for (const f of phoneFields) {
        if (doc[f] && guest.phone && String(doc[f]).trim() === String(guest.phone).trim()) return true;
    }
    return false;
};

/**
 * Single-record reads (by id or by code): login required; admin reads anything, a customer
 * only a record that is theirs. A missing record falls through so the handler answers 404.
 *  find(req) -> the record (or null)
 */
const ownRecord = (find, owner) => [
    protectGuest,
    async (req, res, next) => {
        try {
            if (isAdmin(req)) return next();
            const doc = await find(req);
            if (!doc) return next();
            if (!ownsDoc(doc, req.guest, owner)) {
                return res.status(403).json({ success: false, message: "غير مصرح لك بعرض هذا السجل" });
            }
            next();
        } catch (error) {
            next(error);
        }
    }
];

// By id (param) or by code (param + field, case-insensitive exact match)
const byId = (Model, param = "id") => async (req) =>
    isObjectId(req.params[param]) ? Model.findById(req.params[param]).lean() : null;

const byCode = (Model, field, param = "code") => async (req) =>
    Model.findOne({ [field]: new RegExp(`^${escapeRegex(String(req.params[param]).trim())}$`, "i") }).lean();

/** /guest/:guestId lists: a customer may only ask for their own id; admin for anyone. */
const ownGuestParam = (param = "guestId") => [
    protectGuest,
    (req, res, next) => {
        if (isAdmin(req) || String(req.params[param]) === String(req.guest._id)) return next();
        return res.status(403).json({ success: false, message: "غير مصرح لك بعرض بيانات ضيف آخر" });
    }
];

/**
 * Guest dossier / profile reads (/api/guests/...). Admin: any guest. Customer: only themselves,
 * addressed by their own id, phone or email; with no target given it defaults to their own id.
 */
const ownGuestTarget = [
    protectGuest,
    (req, res, next) => {
        if (isAdmin(req)) return next();
        const g = req.guest;
        const given = req.params.id || req.query.id || req.query.guestId || req.query.phone || req.query.search || "";
        const target = String(given).trim();
        if (!target) {
            req.params.id = String(g._id);
            return next();
        }
        const mine = [String(g._id), g.phone, g.email && String(g.email).toLowerCase()].filter(Boolean).map(String);
        if (mine.includes(target) || mine.includes(target.toLowerCase())) {
            req.params.id = target;
            return next();
        }
        return res.status(403).json({ success: false, message: "غير مصرح لك بعرض بيانات ضيف آخر" });
    }
];

module.exports = { ownRecord, byId, byCode, ownGuestParam, ownGuestTarget, isAdmin };
