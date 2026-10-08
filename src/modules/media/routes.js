const express = require("express");
const router = express.Router();
const { upload, getByPage, getBySection, deleteMedia, updateMediaForSection } = require("./services");
const { arrayOfImages, imageProcessing } = require("../../middlewares/uploadImages");
const { uploadMediaValidator, deleteMediaValidator } = require("./validator");

router.post("/", arrayOfImages("images"), imageProcessing, uploadMediaValidator, upload);

router.get("/page/:page", getByPage);

router.get("/section/:section", getBySection);

router.delete("/:id", deleteMediaValidator, deleteMedia);

router.put("/:page/:section", updateMediaForSection);

module.exports = router;
