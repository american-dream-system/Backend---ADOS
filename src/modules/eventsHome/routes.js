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
    addVenue,
    updateVenue,
    removeVenue,
    reorderVenues,
    addEquipment,
    updateEquipment,
    removeEquipment,
    reorderEquipment,
} = require("./services");

const adminOnly = [protectGuest, allowedTo("admin")];
// Names the stored file after the page and slot (the upload middleware reads page/section from the body)
const nameFile = (req, res, next) => {
    req.body = req.body || {};
    req.body.page = "events-home";
    req.body.section = req.params.slot || "gallery";
    next();
};

// Names the stored venue photo after the list (family | meetings)
const nameVenueFile = (req, res, next) => {
    req.body = req.body || {};
    req.body.page = "events-home";
    req.body.section = `venue-${req.params.list}`;
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

// Admin only: Family Events venues and Meetings spaces (list = family | meetings), fixed paths before the :id routes
router.put("/venues/:list/order", adminOnly, reorderVenues);
router.post("/venues/:list", adminOnly, uploadSingleImage("image"), nameVenueFile, imageProcessing, addVenue);
router.put("/venues/:list/:id", adminOnly, uploadSingleImage("image"), nameVenueFile, imageProcessing, updateVenue);
router.delete("/venues/:list/:id", adminOnly, removeVenue);

// Admin only: Meetings equipment options
router.put("/equipment/order", adminOnly, reorderEquipment);
router.post("/equipment", adminOnly, addEquipment);
router.put("/equipment/:id", adminOnly, updateEquipment);
router.delete("/equipment/:id", adminOnly, removeEquipment);

module.exports = router;
