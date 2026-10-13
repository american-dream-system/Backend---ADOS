const express = require("express");
const router = express.Router();
const { 
    upload, 
    getAllMedia, 
    getMediaById, 
    getByPage, 
    getBySection, 
    getMediaByPageAndSection,
    deleteMedia, 
    updateMediaForSection,
    uploadDirectFile
} = require("./services");
const { arrayOfImages, uploadSingleImage, imageProcessing } = require("../../middlewares/uploadImages");
const { 
    uploadMediaValidator, 
    deleteMediaValidator, 
    sectionParamValidator 
} = require("./validator");

// 1. Direct file upload endpoints (Single and Multiple)
router.post("/upload-file", uploadSingleImage("image"), imageProcessing, uploadDirectFile);
router.post("/upload", arrayOfImages("images"), imageProcessing, uploadDirectFile);

// 2. Base collection routes
router.route("/")
    .post(arrayOfImages("images"), imageProcessing, uploadMediaValidator, upload)
    .get(getAllMedia);

// 3. Named page & section routes
router.get("/page/:page", getByPage);
router.get("/section/:section", getBySection);
router.get("/detail/:page/:section", sectionParamValidator, getMediaByPageAndSection);
router.get("/:page/:section", sectionParamValidator, getMediaByPageAndSection);
router.put("/:page/:section", arrayOfImages("images"), imageProcessing, sectionParamValidator, updateMediaForSection);

// 4. By ID routes (Placed AFTER specific routes)
router.get("/:id", deleteMediaValidator, getMediaById);
router.delete("/:id", deleteMediaValidator, deleteMedia);

module.exports = router;

