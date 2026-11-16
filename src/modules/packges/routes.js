const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../../middlewares/uploadImages");
const { protectGuest, allowedTo, adminOnly } = require("../../middlewares/authMiddleware");
const { guardFeaturedFlag } = require("../playzoneHome/featured");
const { getCategorySettings, saveCategorySettings } = require("./categorySettings");
const {
    createPackage,
    getAllPackages,
    getBirthdayPackages,
    getPackageById,
    updatePackage,
    deletePackage,
    deleteCategory,
    resizePackageImage
} = require("./services");
const {
    createPackageValidator,
    getPackageValidator,
    updatePackageValidator,
    deletePackageValidator
} = require("./validator");

router.post("/", adminOnly, uploadSingleImage("image"), guardFeaturedFlag, resizePackageImage, createPackageValidator, createPackage);
router.get("/", getAllPackages);
router.get("/birthdays", getBirthdayPackages);
router.delete("/categories/:category", adminOnly, deleteCategory);
// Package categories the admin hid or added (public read, admin write)
router.get("/category-settings", getCategorySettings);
router.put("/category-settings", protectGuest, allowedTo("admin"), saveCategorySettings);
router.get("/:id", getPackageValidator, getPackageById);
router.put("/:id", adminOnly, uploadSingleImage("image"), guardFeaturedFlag, resizePackageImage, updatePackageValidator, updatePackage);
router.patch("/:id", adminOnly, uploadSingleImage("image"), guardFeaturedFlag, resizePackageImage, updatePackageValidator, updatePackage);
router.delete("/:id", adminOnly, deletePackageValidator, deletePackage);

module.exports = router;
