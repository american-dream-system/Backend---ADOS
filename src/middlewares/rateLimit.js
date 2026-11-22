// Small in-memory rate limiter for public write endpoints (no extra dependency).
// rateLimit({ windowMs, max, keyOf }) answers 429 once a key has made more than `max` requests in the window.
const rateLimit = ({ windowMs = 10 * 60 * 1000, max = 5, keyOf = (req) => req.ip, message } = {}) => {
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

    return (req, res, next) => {
        const key = keyOf(req);
        const now = Date.now();
        const list = (hits.get(key) || []).filter((t) => t > now - windowMs);
        if (list.length >= max) {
            const retry = Math.ceil((list[0] + windowMs - now) / 1000);
            res.set("Retry-After", String(retry));
            return res.status(429).json({
                success: false,
                message: typeof message === "function" ? message(req) : message || "Too many requests. Please try again later.",
            });
        }
        list.push(now);
        hits.set(key, list);
        next();
    };
};

module.exports = rateLimit;
