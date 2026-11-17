const fs = require("fs");
const path = require("path");

const MEDIA_DIR = path.resolve("upload/media");

// Public URL of a stored image value (uploaded file name, or a frontend static path kept as is)
const mediaUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const v = value.trim();
    if (/^(https?:|data:|blob:|\/photo\/|\/assets\/)/.test(v)) return v;
    const name = v.replace(/^\/+/, "").replace(/^media\//, "");
    return `${process.env.BASE_URL || ""}/media/${name}`;
};

// Removes an uploaded file that is no longer referenced. Only bare names inside upload/media:
// static paths (/photo/...) and anything with a folder part are never touched.
const removeMediaFile = (stored) => {
    if (!stored || typeof stored !== "string") return;
    const name = stored.trim().replace(/^\/+/, "").replace(/^media\//, "");
    if (!/^[A-Za-z0-9_.-]+$/.test(name) || name.startsWith(".")) return;
    const full = path.resolve(MEDIA_DIR, name);
    if (path.dirname(full) !== MEDIA_DIR) return;
    fs.unlink(full, () => {});
};

module.exports = { mediaUrl, removeMediaFile };
