const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../../middlewares/uploadImages");
const {
    createPackage,
    getAllPackages,
    getPackageById,
    updatePackage,
    deletePackage,
    resizePackageImage
} = require("./services");
const {
    createPackageValidator,
    getPackageValidator,
    updatePackageValidator,
    deletePackageValidator
} = require("./validator");

router.post("/", uploadSingleImage("image"), resizePackageImage, createPackageValidator, createPackage);
router.get("/", getAllPackages);
router.get("/:id", getPackageValidator, getPackageById);
router.put("/:id", uploadSingleImage("image"), resizePackageImage, updatePackageValidator, updatePackage);
router.patch("/:id", uploadSingleImage("image"), resizePackageImage, updatePackageValidator, updatePackage);
router.delete("/:id", deletePackageValidator, deletePackage);

module.exports = router;
