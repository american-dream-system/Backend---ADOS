const PaymentAccounts = require("./model");

const FIELDS = ["instapayAddress", "instapayName", "vodafoneNumber", "vodafoneName"];
const MAX = { instapayAddress: 100, instapayName: 100, vodafoneNumber: 30, vodafoneName: 100 };

const getDoc = async () => {
    let doc = await PaymentAccounts.findOne({ key: "payment-accounts" });
    if (!doc) {
        try {
            doc = await PaymentAccounts.create({ key: "payment-accounts" });
        } catch (e) {
            doc = await PaymentAccounts.findOne({ key: "payment-accounts" }); // lost a creation race
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

// The saved accounts, nothing else: no defaults and no environment values
const readPaymentAccounts = async () => serialize(await PaymentAccounts.findOne({ key: "payment-accounts" }).lean());

// @route GET /api/payment-accounts   (public; cached, every write flushes the public cache)
const getPaymentAccountsSetting = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: await readPaymentAccounts() });
    } catch (error) {
        next(error);
    }
};

// @route PUT /api/payment-accounts   (admin) body: any of the fields; an empty value clears it
const setPaymentAccounts = async (req, res, next) => {
    try {
        const body = req.body || {};
        const changes = {};
        for (const f of FIELDS) {
            if (body[f] === undefined) continue;
            if (body[f] !== null && typeof body[f] !== "string") {
                return res.status(400).json({ success: false, message: `${f} must be text` });
            }
            const v = String(body[f] || "").trim();
            if (v.length > MAX[f]) {
                return res.status(400).json({ success: false, message: `${f} can be up to ${MAX[f]} characters` });
            }
            if (f === "vodafoneNumber" && v && !/^[+()\d][\d\s()+-]{2,29}$/.test(v)) {
                return res.status(400).json({ success: false, message: "vodafoneNumber must be a phone number (digits, +, spaces, - and brackets)" });
            }
            if (f === "instapayAddress" && v && /\s/.test(v)) {
                return res.status(400).json({ success: false, message: "instapayAddress cannot contain spaces" });
            }
            changes[f] = v;
        }
        const doc = await getDoc();
        Object.assign(doc, changes);
        await doc.save();
        res.status(200).json({ success: true, data: serialize(doc) });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPaymentAccountsSetting, setPaymentAccounts, readPaymentAccounts };
