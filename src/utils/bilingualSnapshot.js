// Bilingual snapshots of names, titles and zones, taken when an order or booking is created, so the
// record stays readable if the original ticket, package or offer is later edited or deleted.
// Older documents keep one value in `title` (any language): it is placed by script.

const HAS_ARABIC = /[؀-ۿ]/;
const clean = (v) => (v == null ? "" : String(v).trim());

// { ar, en } from the two fields and a legacy single value. A language with no value copies the
// other one, so a snapshot never has an empty side.
const pair = (ar, en, legacy) => {
    let a = clean(ar);
    let e = clean(en);
    if (e && HAS_ARABIC.test(e)) { if (!a) { a = e; e = ""; } else if (a === e) e = ""; }
    if (a && !HAS_ARABIC.test(a)) { if (!e) { e = a; a = ""; } else if (a === e) a = ""; }
    const l = clean(legacy);
    if (l) {
        if (HAS_ARABIC.test(l)) { if (!a) a = l; } else if (!e) e = l;
    }
    return { ar: a || e, en: e || a };
};

// Title pair of a ticket / package document (or any object with title, titleAr, titleEn)
const titlePair = (doc) => (doc ? pair(doc.titleAr, doc.titleEn, doc.title) : { ar: "", en: "" });

// Title pair of an ordered item: the live document at purchase time, else what the client sent
const itemTitlePair = (item, doc) => {
    const d = titlePair(doc);
    const c = pair(item && item.titleAr, item && item.titleEn, item && (item.title || item.name));
    return { ar: d.ar || c.ar, en: d.en || c.en };
};

const ZONES = {
    "kids-area": { ar: "منطقة الأطفال", en: "Kids Area" },
    "fun-park": { ar: "فن بارك", en: "Fun Park" },
    challenge: { ar: "منطقة التحدي", en: "Challenge Zone" },
    adventure: { ar: "منطقة المغامرات", en: "Adventure Zone" },
    packages: { ar: "الباقات", en: "Packages" }
};

const zoneKey = (page) => {
    const z = String(page || "").toLowerCase().replace(/[-_\s]/g, "");
    if (z.includes("kid")) return "kids-area";
    if (z.includes("fun")) return "fun-park";
    if (z.includes("chal")) return "challenge";
    if (z.includes("adv")) return "adventure";
    if (z.includes("pack")) return "packages";
    return "";
};

// { zone, zoneAr, zoneEn } of a ticket / package document's page or category
const zoneSnapshot = (doc) => {
    const key = zoneKey(doc && (doc.page || doc.category));
    const names = ZONES[key];
    return names ? { zone: key, zoneAr: names.ar, zoneEn: names.en } : { zone: clean(doc && doc.page), zoneAr: "", zoneEn: "" };
};

module.exports = { pair, titlePair, itemTitlePair, zoneSnapshot };
