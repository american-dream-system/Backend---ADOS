// Rate limits of the public endpoints. Limits are set so a normal customer never reaches them; a signed-in admin is
// never limited (skipAdmin). Every limiter identifies the visitor by req.ip, the real visitor address
// (see middlewares/clientIp.js), and answers 429 in the customer's language.
const rateLimit = require("./rateLimit");
const { bilingual } = rateLimit;
const { verifyToken } = require("../utils/token");
const Guest = require("../modules/guests/model");

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// A request that carries a valid admin token is never limited
const skipAdmin = async (req) => {
    try {
        const h = req.headers.authorization || "";
        if (!h.startsWith("Bearer ")) return false;
        const decoded = verifyToken(h.split(" ")[1]);
        if (!decoded || !decoded.id) return false;
        const g = await Guest.findById(decoded.id).select("role").lean();
        return !!g && g.role === "admin";
    } catch (e) {
        return false;
    }
};

// The account a request is about: phone, identifier or email, in one normal form (+20... and 20... become 01...)
const accountKey = (req) => {
    const b = req.body || {};
    let v = String(b.phone || b.identifier || b.email || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!v) return "";
    if (v.startsWith("+20")) v = "0" + v.slice(3);
    else if (/^20\d{10}$/.test(v)) v = "0" + v.slice(2);
    return `acct:${v}`;
};

const tooMany = bilingual("محاولات كثيرة جداً. حاول مرة أخرى بعد قليل.", "Too many attempts. Please try again in a little while.");
const tooManyLogin = bilingual(
    "محاولات تسجيل دخول كثيرة. حاول مرة أخرى بعد 15 دقيقة.",
    "Too many sign-in attempts. Please try again in 15 minutes."
);
const tooManyRequests = bilingual("طلبات كثيرة جداً. حاول مرة أخرى بعد قليل.", "Too many requests. Please try again in a little while.");

module.exports = {
    skipAdmin,
    accountKey,
    // Sign in: 30 tries per 15 minutes per visitor address, and 8 FAILED tries per 15 minutes per account
    loginPerIp: rateLimit({ windowMs: 15 * MIN, max: 30, message: tooManyLogin }),
    loginPerAccount: rateLimit({ windowMs: 15 * MIN, max: 8, keyOf: accountKey, onlyFailures: true, message: tooManyLogin }),
    // Sign up: 30 per hour per address (customers share the venue's Wi-Fi)
    signupPerIp: rateLimit({ windowMs: HOUR, max: 30, message: tooMany }),
    // Forgot password: 5 per hour per address, 3 per hour per account
    forgotPerIp: rateLimit({ windowMs: HOUR, max: 5, message: tooMany }),
    forgotPerAccount: rateLimit({ windowMs: HOUR, max: 3, keyOf: accountKey, message: tooMany }),
    // Reset code check and new password: 20 per hour per address, 8 FAILED tries per hour per account (6-digit codes)
    resetPerIp: rateLimit({ windowMs: HOUR, max: 20, message: tooMany }),
    resetPerAccount: rateLimit({ windowMs: HOUR, max: 8, keyOf: accountKey, onlyFailures: true, message: tooMany }),
    // Table bookings: 40 per hour per address (shared venue Wi-Fi; an admin booking for guests is never limited)
    tableBookingPerIp: rateLimit({ windowMs: HOUR, max: 40, skip: skipAdmin, message: tooManyRequests }),
    // Chatbot: 40 messages per 10 minutes per address
    chatbotPerIp: rateLimit({ windowMs: 10 * MIN, max: 40, skip: skipAdmin, message: tooManyRequests }),
};
