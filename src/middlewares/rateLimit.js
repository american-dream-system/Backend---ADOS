// Small in-memory rate limiter for public endpoints (no extra dependency).
//
//   rateLimit({ windowMs, max, keyOf, message, onlyFailures, skip })
//
// - keyOf(req): who is limited. Default is req.ip, which is the REAL visitor address: server.js mounts
//   middlewares/clientIp.js (trusted proxy header, only believed when the peer is Cloudflare) before every route.
// - onlyFailures: only responses with status >= 400 count (a successful login never uses up the allowance).
// - skip(req): async/sync, true = no limit for this request (used so a signed-in admin is never limited).
// - message: text, or (req) => text; use bilingual(ar, en) so the 429 follows the customer's language.
// Limits reset when the server restarts.
const rateLimit = ({ windowMs = 10 * 60 * 1000, max = 5, keyOf = (req) => req.ip, message, onlyFailures = false, skip } = {}) => {
    const hits = new Map(); // key -> [timestamps]
    const sweep = setInterval(() => {
        const cutoff = Date.now() - windowMs;
        for (const [k, list] of hits) {
            const fresh = list.filter((t) => t > cutoff);
            if (fresh.length) hits.set(k, fresh);
            else hits.delete(k);
        }
    }, windowMs);
    if (sweep.unref) sweep.unref();

    return async (req, res, next) => {
        try {
            if (skip && (await skip(req))) return next();
            const key = keyOf(req);
            if (!key) return next();
            const now = Date.now();
            const list = (hits.get(key) || []).filter((t) => t > now - windowMs);
            if (list.length >= max) {
                res.set("Retry-After", String(Math.ceil((list[0] + windowMs - now) / 1000)));
                return res.status(429).json({
                    success: false,
                    message: typeof message === "function" ? message(req) : message || "Too many requests. Please try again later.",
                });
            }
            if (onlyFailures) {
                res.on("finish", () => {
                    if (res.statusCode >= 400 && res.statusCode !== 429) {
                        const cur = (hits.get(key) || []).filter((t) => t > Date.now() - windowMs);
                        cur.push(Date.now());
                        hits.set(key, cur);
                    }
                });
            } else {
                list.push(now);
                hits.set(key, list);
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

// The customer's language for a message: X-App-Lang (sent by the site), body.lang, Accept-Language, else Arabic
const isEnglish = (req) => {
    const h = String(req.headers["x-app-lang"] || "").toLowerCase();
    if (h === "en" || h === "ar") return h === "en";
    const l = req.body && req.body.lang;
    if (l === "en" || l === "ar") return l === "en";
    return /^en/i.test(String(req.headers["accept-language"] || ""));
};
const bilingual = (ar, en) => (req) => (isEnglish(req) ? en : ar);

module.exports = rateLimit;
module.exports.bilingual = bilingual;
module.exports.isEnglish = isEnglish;
