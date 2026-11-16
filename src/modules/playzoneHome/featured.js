const ticketModel = require("../tickets/model");
const packageModel = require("../packges/model");

// The admin flags up to 3 items (Play Zone home picker). The flag lives on the ticket / package
// document itself, so an item that is deleted or unpublished drops out of the list by itself.
const FLAG = "homePopular";
const MAX_FEATURED = 3;
const FLAG_ON = { $in: [true, "true"] };
const PASS_ZONES = ["challenge", "adventure"];

const isOn = (v) => v === true || v === "true";

// Same page normalisation the admin uses (kidsArea / kid-area / kids-area ... -> kids-area)
const zoneOf = (page) => {
    const s = String(page || "").toLowerCase().replace(/[-_\s]/g, "");
    if (s.includes("kid")) return "kids-area";
    if (s.includes("fun")) return "fun-park";
    if (s.includes("chal")) return "challenge";
    if (s.includes("adv")) return "adventure";
    if (s.includes("pack") || !s) return "packages";
    return String(page);
};

const byCreated = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
const isBirthday = (p) => p.page === "birthday" || p.category === "birthday";

// Featured items that can be shown right now: active, not a birthday package, at most 3.
// kind: 'package' (Packages tab), 'pass' (Challenge / Adventure pass), 'offer' (any other ticket)
const getFeaturedItems = async () => {
    const [pkgs, tkts] = await Promise.all([
        packageModel.find({ [FLAG]: FLAG_ON, active: { $ne: false } }).lean(),
        ticketModel.find({ [FLAG]: FLAG_ON, active: { $ne: false } }).lean(),
    ]);
    const items = [
        ...pkgs.filter((p) => !isBirthday(p)).sort(byCreated).map((doc) => ({
            kind: "package",
            zone: "packages",
            id: String(doc._id),
            doc,
        })),
        ...tkts.sort(byCreated).map((doc) => {
            const zone = zoneOf(doc.page);
            const kind = PASS_ZONES.includes(zone) && doc.category === "package" ? "pass" : "offer";
            return { kind, zone, id: String(doc._id), doc };
        }),
    ];
    return items.slice(0, MAX_FEATURED);
};

// Admin write guard: the flag can be set on at most 3 live items (packages + tickets together).
// Creating an item never flags it; only an update can.
const guardFeaturedFlag = (req, res, next) => {
    const body = req.body || {};
    if (req.method === "POST") {
        delete body[FLAG];
        return next();
    }
    if (!(FLAG in body) || !isOn(body[FLAG])) return next();
    const others = { [FLAG]: FLAG_ON, active: { $ne: false }, _id: { $ne: req.params.id } };
    Promise.all([ticketModel.countDocuments(others), packageModel.countDocuments(others)])
        .then(([a, b]) => {
            if (a + b >= MAX_FEATURED) {
                return res.status(400).json({
                    success: false,
                    message: `At most ${MAX_FEATURED} items can be featured on the Play Zone home`,
                });
            }
            return next();
        })
        .catch(next);
};

module.exports = { FLAG, MAX_FEATURED, getFeaturedItems, guardFeaturedFlag };
