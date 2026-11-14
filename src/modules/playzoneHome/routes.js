const express = require("express");
const router = express.Router();
const { protectGuest, allowedTo } = require("../../middlewares/authMiddleware");
const { uploadSingleImage, imageProcessing } = require("../../middlewares/uploadImages");
const {
    getPlayzoneHome,
    setHero,
    setZone,
    setZoneDescription,
    setActivity,
    addPackage,
    updatePackage,
    deletePackage,
} = require("./services");
const { createPackageValidator, updatePackageValidator } = require("./validator");

const adminOnly = [protectGuest, allowedTo("admin")];
const image = [uploadSingleImage("image"), imageProcessing];

// Public: the Play Zone home page reads this
router.get("/", getPlayzoneHome);

// Admin: single image slots (DELETE resets the slot to the static default)
router.put("/hero", adminOnly, image, setHero);
router.delete("/hero", adminOnly, setHero);
router.put("/zones/:key/description", adminOnly, setZoneDescription);
router.put("/zones/:key", adminOnly, image, setZone);
router.delete("/zones/:key", adminOnly, setZone);
router.put("/activities/:index", adminOnly, image, setActivity);
router.delete("/activities/:index", adminOnly, setActivity);

// Admin: popular packages (max 3)
router.post("/packages", adminOnly, image, createPackageValidator, addPackage);
router.put("/packages/:id", adminOnly, image, updatePackageValidator, updatePackage);
router.delete("/packages/:id", adminOnly, deletePackage);

module.exports = router;
