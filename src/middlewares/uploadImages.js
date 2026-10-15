const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const uploadOptions = () => {

    // filter accept only images
    const imageOnly = function (req, file, cb) {
        if (file.mimetype.split("/")[0] === "image") {
            cb(null, true);
        } else {
            cb(new Error("Image files only accept"), false);
        }
    };

    // 2- memory storage engine
    const storage = multer.memoryStorage(); // not take any thing like disk storage, just return object of data
    return multer({ storage: storage, fileFilter: imageOnly });
};

const fs = require("fs");

// Ensure upload directories exist
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
ensureDir("upload/media");

const imageProcessing = async (req, res, next) => {
    try {
        ensureDir("upload/media");
        const page = (req.body && req.body.page) ? String(req.body.page).replace(/[^a-zA-Z0-9_-]/g, "") : "general";
        const section = (req.body && req.body.section) ? String(req.body.section).replace(/[^a-zA-Z0-9_-]/g, "") : "general";
        const name = (req.body && req.body.name) ? String(req.body.name).replace(/[^a-zA-Z0-9_-]/g, "") : "item";

        // Handle single file (req.file)
        if (req.file) {
            const fileName = `media-${page}-${section}-${name}-${Date.now()}-${uuidv4().substring(0, 6)}.jpeg`;
            await sharp(req.file.buffer)
                .resize(1920, 1920, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`upload/media/${fileName}`);

            req.body.image = fileName;
            req.body.imageUrl = `/media/${fileName}`;
            if (!req.body.images) req.body.images = [];
            req.body.images.push(fileName);
        }

        // Handle multiple files (req.files)
        if (req.files && req.files.length > 0) {
            const images = req.body.images && Array.isArray(req.body.images) ? [...req.body.images] : [];

            for (const file of req.files) {
                const fileName = `media-${page}-${section}-${name}-${Date.now()}-${uuidv4().substring(0, 6)}.jpeg`;

                await sharp(file.buffer)
                    .resize(1920, 1920, {
                        fit: "inside",
                        withoutEnlargement: true,
                    })
                    .toFormat("jpeg")
                    .jpeg({ quality: 90 })
                    .toFile(`upload/media/${fileName}`);

                images.push(fileName);
            }

            req.body.images = images;
            if (images.length > 0 && !req.body.image) {
                req.body.image = images[0];
                req.body.imageUrl = `/media/${images[0]}`;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

const uploadSingleImage =
    (fieldName = "image") =>
        (req, res, next) => {
            const upload = uploadOptions().single(fieldName);
            upload(req, res, (err) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                next();
            });
        };

const uploadMixOfImages = (arrayOfFields) =>
    uploadOptions().fields(arrayOfFields);

const arrayOfImages = (fields = "images") => {
    return uploadOptions().array(fields, 10);
}

module.exports = {
    uploadSingleImage,
    uploadMixOfImages,
    arrayOfImages,
    imageProcessing
};
