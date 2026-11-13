// Media path helpers.
//
// Storage rule: the database keeps only
//   - a bare file name or relative sub-path of upload/media   ("hero-123.jpeg", "events/e1.jpg")
//   - or a frontend static path                                ("/photo/...", "/assets/...")
//   - or a third-party absolute URL we do not host             ("https://images.unsplash.com/...")
// Absolute URLs that point at this backend (BASE_URL, localhost, ngrok, our domain) are
// reduced to the relative form on write. The full URL is built at read time from BASE_URL.

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)$/i;
const OWN_SUFFIXES = [
    "americandreamismailia.com",
    ".ngrok-free.app",
    ".ngrok-free.dev",
    ".ngrok.app",
    ".ngrok.io",
    ".vercel.app",
];

const hostOf = (value) => {
    try {
        return new URL(value, "http://placeholder.invalid").hostname.toLowerCase();
    } catch {
        return "";
    }
};

const baseUrlHost = () => (process.env.BASE_URL ? hostOf(process.env.BASE_URL) : "");

const isOwnHost = (host) => {
    if (!host) return false;
    if (LOCAL_HOST_RE.test(host)) return true;
    if (host === baseUrlHost()) return true;
    return OWN_SUFFIXES.some((s) => (s.startsWith(".") ? host.endsWith(s) : host === s || host.endsWith(`.${s}`)));
};

const isAbsolute = (v) => /^(https?:)?\/\//i.test(v);
const isInline = (v) => /^(data|blob):/i.test(v);

/**
 * Value to STORE. Idempotent. Non-strings and empty values pass through.
 */
const normalizeImagePath = (value) => {
    if (typeof value !== "string") return value;
    let v = value.trim();
    if (!v || isInline(v)) return v;

    if (isAbsolute(v)) {
        const full = v.startsWith("//") ? `http:${v}` : v;
        let url;
        try {
            url = new URL(full);
        } catch {
            return v;
        }
        if (!isOwnHost(url.hostname.toLowerCase())) return v; // third-party content, keep as is
        v = decodeURI(url.pathname);
    } else {
        v = v.split(/[?#]/)[0];
    }

    v = v.replace(/^\/+/, "");
    v = v.replace(/^upload\/media\//i, "").replace(/^media\//i, "");

    if (/^(photo|assets)\//i.test(v)) return `/${v}`;
    return v;
};

const absoluteBase = () => {
    const base = (process.env.BASE_URL || "").trim().replace(/\/+$/, "");
    if (!base) return "";
    // Never hand a localhost URL to production clients.
    if (process.env.NODE_ENV === "production" && LOCAL_HOST_RE.test(baseUrlHost())) return "";
    return base;
};

/**
 * Value to RETURN to clients. Builds the full URL from BASE_URL.
 */
const toPublicUrl = (value) => {
    if (typeof value !== "string") return value;
    const v = value.trim();
    if (!v || isInline(v)) return v;
    if (isAbsolute(v) && !isOwnHost(hostOf(v.startsWith("//") ? `http:${v}` : v))) return v; // third-party

    const n = normalizeImagePath(v);
    if (!n) return n;
    if (n.startsWith("/photo/") || n.startsWith("/assets/")) return n; // served by the frontend
    return `${absoluteBase()}/media/${n}`;
};

// Recursively normalise free-form data: only strings that are own-host absolute URLs
// pointing at /media/ are reduced; everything else is left untouched.
const normalizeOwnMediaUrlsDeep = (node) => {
    if (typeof node === "string") {
        if (isAbsolute(node) && isOwnHost(hostOf(node.startsWith("//") ? `http:${node}` : node)) && /\/media\//i.test(node)) {
            return `/media/${normalizeImagePath(node)}`; // free-form data keeps the /media/ prefix
        }
        return node;
    }
    if (Array.isArray(node)) return node.map(normalizeOwnMediaUrlsDeep);
    if (node && typeof node === "object" && node.constructor === Object) {
        const out = {};
        for (const [k, val] of Object.entries(node)) out[k] = normalizeOwnMediaUrlsDeep(val);
        return out;
    }
    return node;
};

// Read side for free-form data: "/media/x" strings get the BASE_URL prefix.
const publicizeExtraDataDeep = (node) => {
    if (typeof node === "string") return node.toLowerCase().startsWith("/media/") ? `${absoluteBase()}${node}` : node;
    if (Array.isArray(node)) return node.map(publicizeExtraDataDeep);
    if (node && typeof node === "object" && node.constructor === Object) {
        const out = {};
        for (const [k, val] of Object.entries(node)) out[k] = publicizeExtraDataDeep(val);
        return out;
    }
    return node;
};

module.exports = {
    publicizeExtraDataDeep, normalizeImagePath, toPublicUrl, normalizeOwnMediaUrlsDeep, isOwnHost };
