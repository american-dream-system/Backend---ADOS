// Short in-memory cache for public GET responses.
//
// - Only anonymous GET requests that returned 200 are cached (anything with an
//   Authorization header is served fresh, so admin/user-specific data is never shared).
// - Any write request (POST/PUT/PATCH/DELETE) anywhere in the app flushes the whole
//   cache once it finishes, so admin edits show up immediately.
// - Clients always revalidate (Cache-Control: no-cache + ETag), so a 304 is sent when
//   nothing changed and an edit is never hidden behind a browser max-age.

const store = new Map();
const DEFAULT_TTL_MS = 30 * 1000;
const MAX_ENTRIES = 200;

const flush = () => store.clear();

// Mount app-wide, before the routes: flushes the cache after every write request.
const flushOnWrite = (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
        res.on("finish", flush);
    }
    next();
};

// Mount on the public routes to cache.
const publicCache = ({ ttlMs = DEFAULT_TTL_MS } = {}) => (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    res.set("Cache-Control", "no-cache");

    if (hit && hit.expires > Date.now()) {
        res.set("Content-Type", hit.contentType);
        res.set("X-Cache", "HIT");
        return res.send(hit.body); // express adds ETag and answers 304 when it matches
    }

    const send = res.send.bind(res);
    res.send = (body) => {
        if (res.statusCode === 200 && (typeof body === "string" || Buffer.isBuffer(body))) {
            if (store.size >= MAX_ENTRIES) store.clear();
            store.set(key, {
                body,
                contentType: res.get("Content-Type") || "application/json; charset=utf-8",
                expires: Date.now() + ttlMs,
            });
        }
        res.set("X-Cache", "MISS");
        return send(body);
    };
    next();
};

module.exports = { publicCache, flushOnWrite, flush };
