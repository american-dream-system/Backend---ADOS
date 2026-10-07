const express = require("express");
const router = express.Router();
const { upload, getByPage, getBySection, deleteMedia, updateMediaForSection } = require("./services");
const { arrayOfImages, imageProcessing } = require("../../middlewares/uploadImages");


router.post("/", arrayOfImages("images"), imageProcessing, upload);

router.get("/page/:page", getByPage);

router.get("/section/:section", getBySection);

router.delete("/:id", deleteMedia);

router.put("/:page/:section", updateMediaForSection);

module.exports = router;
