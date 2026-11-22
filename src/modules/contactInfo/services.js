const ContactInfo = require("./model");

const FIELDS = ["phone", "whatsapp", "hotline", "hoursEn", "hoursAr", "addressEn", "addressAr", "mapUrl"];
const PHONE_FIELDS = ["phone", "whatsapp", "hotline"];
const TEXT_MAX = { hoursEn: 300, hoursAr: 300, addressEn: 300, addressAr: 300 };

const getDoc = async () => {
    let doc = await ContactInfo.findOne({ key: "contact-info" });
    if (!doc) {
        try {
            doc = await ContactInfo.create({ key: "contact-info" });
        } catch (e) {
            doc = await ContactInfo.findOne({ key: "contact-info" }); // lost a creation race
            if (!doc) throw e;
        }
    }
    return doc;
};

const serialize = (doc) => {
    const out = {};
    FIELDS.forEach((f) => {
        out[f] = (doc && doc[f]) || "";
    });
    return out;
};

// Same answer for the website and for the chatbot tool
const readContactInfo = async () => serialize(await ContactInfo.findOne({ key: "contact-info" }).lean());

// @route GET /api/contact-info   (public)
const getContactInfo = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: serialize(await getDoc()) });
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/contact-info   (admin) body: any of the fields; an empty value clears it
const setContactInfo = async (req, res, next) => {
    try {
        const body = req.body || {};
        const next_ = {};
        for (const f of FIELDS) {
            if (body[f] === undefined) continue;
            if (body[f] !== null && typeof body[f] !== "string") {
                return res.status(400).json({ success: false, message: `${f} must be text` });
            }
            const v = String(body[f] || "").trim();
            if (PHONE_FIELDS.includes(f) && v && !/^[+()\d][\d\s()+-]{2,29}$/.test(v)) {
                return res.status(400).json({ success: false, message: `${f} must be a phone number (digits, +, spaces, - and brackets)` });
            }
            if (f === "mapUrl" && v && !/^https?:\/\/[^\s]{3,480}$/i.test(v)) {
                return res.status(400).json({ success: false, message: "mapUrl must be a link starting with http:// or https://" });
            }
            if (TEXT_MAX[f] && v.length > TEXT_MAX[f]) {
                return res.status(400).json({ success: false, message: `${f} can be up to ${TEXT_MAX[f]} characters` });
            }
            next_[f] = v;
        }
        const doc = await getDoc();
        Object.assign(doc, next_);
        await doc.save();
        res.status(200).json({ success: true, data: serialize(doc) });
    } catch (error) {
        next(error);
    }
};

module.exports = { getContactInfo, setContactInfo, readContactInfo };
