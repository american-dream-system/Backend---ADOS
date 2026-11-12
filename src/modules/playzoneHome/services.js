const PlayzoneHome = require("./model");

const ZONE_KEYS = ["kids-area", "fun-park", "challenge", "adventure"];
const ACTIVITY_SLOTS = 4;
const MAX_PACKAGES = 3;

const getDoc = async () => {
    let doc = await PlayzoneHome.findOne({ key: "playzone-home" });
    if (!doc) doc = await PlayzoneHome.create({ key: "playzone-home" });
    // Keep the fixed-size arrays at full length
    while (doc.zoneImages.length < ZONE_KEYS.length) doc.zoneImages.push("");
    while (doc.activityImages.length < ACTIVITY_SLOTS) doc.activityImages.push("");
    return doc;
};

const imageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const v = value.trim();
    if (/^(https?:|data:|blob:|\/photo\/|\/assets\/)/.test(v)) return v;
    const name = v.replace(/^\/+/, "").replace(/^media\//, "");
    return `${process.env.BASE_URL || ""}/media/${name}`;
};

const serialize = (doc) => {
    const zones = {};
    ZONE_KEYS.forEach((k, i) => {
        zones[k] = imageUrl(doc.zoneImages[i]);
    });
    return {
        hero: { image: imageUrl(doc.heroImage) },
        zones,
        activities: doc.activityImages.slice(0, ACTIVITY_SLOTS).map(imageUrl),
        packages: doc.packages.map((p) => ({
            _id: p._id,
            titleEn: p.titleEn,
            titleAr: p.titleAr,
            price: p.price,
            image: imageUrl(p.image),
            bullets: p.bullets.map((b) => ({ en: b.en, ar: b.ar })),
        })),
    };
};

// undefined = field not sent, null = invalid, array = parsed list
const parseBullets = (raw) => {
    if (raw === undefined) return undefined;
    let list = raw;
    if (typeof raw === "string") {
        try {
            list = JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }
    if (!Array.isArray(list)) return null;
    return list
        .map((b) => ({ en: String((b && b.en) || "").trim(), ar: String((b && b.ar) || "").trim() }))
        .filter((b) => b.en || b.ar);
};

const send = (res, doc, status = 200) => res.status(status).json({ success: true, data: serialize(doc) });

// @desc Get Play Zone home content
// @route GET /api/playzone-home
// @access Public
const getPlayzoneHome = async (req, res, next) => {
    try {
        send(res, await getDoc());
    } catch (error) {
        next(error);
    }
};

// Sets one image slot from the uploaded file (DELETE clears it back to the default)
const slotUpdater = (apply) => async (req, res, next) => {
    try {
        req.body = req.body || {};
        const clear = req.method === "DELETE";
        if (!clear && !req.body.image) {
            return res.status(400).json({ success: false, message: "Image file is required (field: image)" });
        }
        const doc = await getDoc();
        const ok = apply(doc, req, clear ? "" : req.body.image);
        if (ok === false) {
            return res.status(400).json({ success: false, message: "Invalid slot" });
        }
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

// @route PUT|DELETE /api/playzone-home/hero
const setHero = slotUpdater((doc, req, value) => {
    doc.heroImage = value;
});

// @route PUT|DELETE /api/playzone-home/zones/:key
const setZone = slotUpdater((doc, req, value) => {
    const idx = ZONE_KEYS.indexOf(req.params.key);
    if (idx < 0) return false;
    doc.zoneImages.set(idx, value);
});

// @route PUT|DELETE /api/playzone-home/activities/:index   (index 0-3)
const setActivity = slotUpdater((doc, req, value) => {
    const idx = Number(req.params.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= ACTIVITY_SLOTS) return false;
    doc.activityImages.set(idx, value);
});

// @route POST /api/playzone-home/packages
const addPackage = async (req, res, next) => {
    try {
        req.body = req.body || {};
        const doc = await getDoc();
        if (doc.packages.length >= MAX_PACKAGES) {
            return res.status(400).json({ success: false, message: `Maximum ${MAX_PACKAGES} packages allowed` });
        }
        const bullets = parseBullets(req.body.bullets);
        if (bullets === null) {
            return res.status(400).json({ success: false, message: "bullets must be a JSON array of {en, ar}" });
        }
        doc.packages.push({
            titleEn: req.body.titleEn,
            titleAr: req.body.titleAr || "",
            price: Number(req.body.price),
            image: req.body.image || "",
            bullets: bullets || [],
        });
        await doc.save();
        send(res, doc, 201);
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/playzone-home/packages/:id
const updatePackage = async (req, res, next) => {
    try {
        req.body = req.body || {};
        const doc = await getDoc();
        const pkg = doc.packages.id(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
        const bullets = parseBullets(req.body.bullets);
        if (bullets === null) {
            return res.status(400).json({ success: false, message: "bullets must be a JSON array of {en, ar}" });
        }
        if (req.body.titleEn !== undefined) pkg.titleEn = req.body.titleEn;
        if (req.body.titleAr !== undefined) pkg.titleAr = req.body.titleAr;
        if (req.body.price !== undefined) pkg.price = Number(req.body.price);
        if (bullets !== undefined) pkg.bullets = bullets;
        if (req.body.image) pkg.image = req.body.image;
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

// @route DELETE /api/playzone-home/packages/:id
const deletePackage = async (req, res, next) => {
    try {
        const doc = await getDoc();
        const pkg = doc.packages.id(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
        pkg.deleteOne();
        await doc.save();
        send(res, doc);
    } catch (error) {
        next(error);
    }
};

module.exports = { getPlayzoneHome, setHero, setZone, setActivity, addPackage, updatePackage, deletePackage };
