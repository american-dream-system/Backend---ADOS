// One-time media hygiene script.
//
//   node src/scripts/normalizeMedia.js                  dry run (default): prints what WOULD change, writes nothing
//   node src/scripts/normalizeMedia.js --apply          writes the changes (after saving a JSON backup of the old values)
//   --media-dir <dir>      folder to check file existence against (default: upload/media)
//   --files-list <file>    text file with one existing file name per line, instead of reading --media-dir
//   --backup-dir <dir>     where --apply saves the backup (default: upload/backups)
//
// What it does, per Media record:
//   1. images[], items[].image and own-host image URLs inside extraData are reduced to relative
//      paths / bare file names (localhost, BASE_URL, our domain, ngrok, vercel become relative).
//      Third-party URLs (e.g. unsplash) and /photo/ /assets/ paths are left alone.
//   2. Reports every reference whose file does not exist in the media folder.
// It never touches page/section/title text, never deletes a record, and never changes anything
// unless --apply is given. Values are paths only; no secrets are printed.

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { normalizeImagePath, normalizeOwnMediaUrlsDeep } = require("../utils/mediaPath");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const APPLY = flag("--apply");
const MEDIA_DIR = path.resolve(opt("--media-dir", path.join(__dirname, "../../upload/media")));
const FILES_LIST = opt("--files-list");
const BACKUP_DIR = path.resolve(opt("--backup-dir", path.join(__dirname, "../../upload/backups")));

const loadExisting = () => {
    if (FILES_LIST) {
        return new Set(fs.readFileSync(FILES_LIST, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
    }
    const walk = (dir, prefix = "") =>
        fs.existsSync(dir)
            ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
                  e.isDirectory() ? walk(path.join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`])
            : [];
    return new Set(walk(MEDIA_DIR));
};

// A stored value refers to a file in upload/media only if it is a bare name or relative sub-path.
const refersToMediaFile = (v) =>
    typeof v === "string" && v && !/^(https?:|data:|blob:|\/)/i.test(v);

(async () => {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
        console.error("DB_URL is missing");
        process.exit(1);
    }
    await mongoose.connect(dbUrl);
    const col = mongoose.connection.collection("media");
    const existing = loadExisting();
    const docs = await col.find({}).toArray();

    console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
    console.log(`Records: ${docs.length}   Files known in media folder: ${existing.size}\n`);

    const changes = [];
    const missing = [];
    const external = new Set();

    for (const doc of docs) {
        const label = `${doc._id} ${doc.page}/${doc.section}`;
        const set = {};
        const note = (field, before, after) => changes.push({ id: String(doc._id), label, field, before, after });

        if (Array.isArray(doc.images)) {
            const next = doc.images.map((v, i) => {
                const n = normalizeImagePath(v);
                if (n !== v) note(`images[${i}]`, v, n);
                return n;
            });
            if (next.some((n, i) => n !== doc.images[i])) set.images = next;
        }
        if (Array.isArray(doc.items)) {
            const nextItems = doc.items.map((it, i) => {
                if (it && typeof it.image === "string") {
                    const n = normalizeImagePath(it.image);
                    if (n !== it.image) {
                        note(`items[${i}].image`, it.image, n);
                        return { ...it, image: n };
                    }
                }
                return it;
            });
            if (nextItems.some((it, i) => it !== doc.items[i])) set.items = nextItems;
        }
        if (doc.extraData && typeof doc.extraData === "object") {
            const next = normalizeOwnMediaUrlsDeep(doc.extraData);
            if (JSON.stringify(next) !== JSON.stringify(doc.extraData)) {
                note("extraData", "(own-host media URLs)", "(relative)");
                set.extraData = next;
            }
        }

        // Missing-file report uses the values as they will be after normalisation.
        const finalImages = set.images || doc.images || [];
        const finalItemImgs = (set.items || doc.items || []).map((it) => it && it.image).filter(Boolean);
        for (const v of [...finalImages, ...finalItemImgs]) {
            if (refersToMediaFile(v)) {
                if (!existing.has(v)) missing.push({ label, ref: v });
            } else if (/^https?:/i.test(v || "")) {
                external.add(new URL(v).hostname);
            }
        }

        if (APPLY && Object.keys(set).length) {
            doc.__set = set; // applied after the backup below
        }
    }

    console.log(`== Changes (${changes.length})`);
    changes.forEach((c) => console.log(`- [${c.label}] ${c.field}\n    ${c.before}\n -> ${c.after}`));

    console.log(`\n== Missing files (${missing.length}) - referenced but not found in the media folder`);
    missing.forEach((m) => console.log(`- [${m.label}] ${m.ref}`));

    console.log(`\n== Third-party hosts left untouched: ${[...external].join(", ") || "none"}`);

    if (APPLY) {
        const toWrite = docs.filter((d) => d.__set);
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const backupFile = path.join(BACKUP_DIR, `media-before-normalize-${Date.now()}.json`);
        fs.writeFileSync(
            backupFile,
            JSON.stringify(toWrite.map((d) => ({ _id: d._id, images: d.images, items: d.items, extraData: d.extraData })), null, 2)
        );
        for (const d of toWrite) await col.updateOne({ _id: d._id }, { $set: d.__set });
        console.log(`\nApplied to ${toWrite.length} records. Backup of old values: ${backupFile}`);
    } else {
        console.log("\nDry run only. Re-run with --apply to write these changes.");
    }
    await mongoose.disconnect();
})().catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
});
