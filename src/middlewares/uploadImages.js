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

const imageProcessing = async (req, res, next) => {
    if (req.files && req.files.length > 0) {
        const images = [];

        for (const file of req.files) {
            const fileName = `media-${req.body.page}-${req.body.section}-${req.body.name}-${Date.now()}.jpeg`;

            await sharp(file.buffer)
                .resize(1024, 1024, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`upload/media/${fileName}`);

            images.push(fileName);
        }

        req.body.images = images;
    }

    next();
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
