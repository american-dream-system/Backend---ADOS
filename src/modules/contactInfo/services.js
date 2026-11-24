const ContactInfo = require("./model");

const FIELDS = ["phone", "whatsapp", "hotline", "hoursEn", "hoursAr", "winterTitleEn", "winterTitleAr", "winterHoursEn", "winterHoursAr", "winterDaysEn", "winterDaysAr", "summerTitleEn", "summerTitleAr", "summerHoursEn", "summerHoursAr", "summerDaysEn", "summerDaysAr", "breakfastTitleEn", "breakfastTitleAr", "breakfastHoursEn", "breakfastHoursAr", "breakfastDaysEn", "breakfastDaysAr", "addressEn", "addressAr", "mapUrl", "facebookUrl", "instagramUrl", "youtubeUrl", "tiktokUrl"];
const URL_FIELDS = ["mapUrl", "facebookUrl", "instagramUrl", "youtubeUrl", "tiktokUrl"];
const PHONE_FIELDS = ["phone", "whatsapp", "hotline"];
const TEXT_MAX = { hoursEn: 300, hoursAr: 300, addressEn: 300, addressAr: 300, ...Object.fromEntries(["winterTitleEn", "winterTitleAr", "winterHoursEn", "winterHoursAr", "winterDaysEn", "winterDaysAr", "summerTitleEn", "summerTitleAr", "summerHoursEn", "summerHoursAr", "summerDaysEn", "summerDaysAr", "breakfastTitleEn", "breakfastTitleAr", "breakfastHoursEn", "breakfastHoursAr", "breakfastDaysEn", "breakfastDaysAr"].map((f) => [f, /Title/.test(f) ? 80 : 120])) };

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

// One line per filled card ("Winter hours: 12:00 PM - 1:00 AM, Sunday to Saturday"). Used by readers of the opening hours
// (the chatbot); falls back to the older single hoursEn / hoursAr text when no card is filled.
const scheduleSummary = (c, lang) => {
    const L = lang === "ar" ? "Ar" : "En";
    const O = lang === "ar" ? "En" : "Ar";
    const pick = (k) => c[k + L] || c[k + O] || "";
    const lines = ["winter", "summer", "breakfast"].map((card) => {
        const hours = pick(card + "Hours");
        if (!hours) return "";
        const title = pick(card + "Title");
        const days = pick(card + "Days");
        return `${title ? title + ": " : ""}${hours}${days ? ", " + days : ""}`;
    }).filter(Boolean);
    return lines.length ? lines.join("\n") : (lang === "ar" ? c.hoursAr || c.hoursEn : c.hoursEn || c.hoursAr) || "";
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
            if (URL_FIELDS.includes(f) && v && !/^https?:\/\/[^\s]{3,480}$/i.test(v)) {
                return res.status(400).json({ success: false, message: `${f} must be a link starting with http:// or https://` });
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

module.exports = {
    scheduleSummary, getContactInfo, setContactInfo, readContactInfo };
