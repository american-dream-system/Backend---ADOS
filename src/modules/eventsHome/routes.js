const express = require("express");
const router = express.Router();
const { protectGuest, allowedTo } = require("../../middlewares/authMiddleware");
const { uploadSingleImage, arrayOfImages, imageProcessing } = require("../../middlewares/uploadImages");
const {
    getEventsHome,
    setBirthdayPerPerson,
    setImage,
    addGalleryImages,
    replaceGalleryImage,
    removeGalleryImage,
    reorderGallery,
} = require("./services");

const adminOnly = [protectGuest, allowedTo("admin")];
// Names the stored file after the page and slot (the upload middleware reads page/section from the body)
const nameFile = (req, res, next) => {
    req.body = req.body || {};
    req.body.page = "events-home";
    req.body.section = req.params.slot || "gallery";
    next();
};

// Public: the Birthdays & Events page reads this
router.get("/", getEventsHome);

// Admin only
router.put("/images/:slot", adminOnly, uploadSingleImage("image"), nameFile, imageProcessing, setImage);
router.delete("/images/:slot", adminOnly, setImage);

// Admin only: Birthday Parties per-person prices and include lists
router.put("/birthday-per-person", adminOnly, setBirthdayPerPerson);

// Admin only: gallery section (fixed paths first, then the per-image routes)
router.put("/gallery/order", adminOnly, reorderGallery);
router.post("/gallery", adminOnly, arrayOfImages("images"), nameFile, imageProcessing, addGalleryImages);
router.put("/gallery/:id", adminOnly, uploadSingleImage("image"), nameFile, imageProcessing, replaceGalleryImage);
router.delete("/gallery/:id", adminOnly, removeGalleryImage);

module.exports = router;
