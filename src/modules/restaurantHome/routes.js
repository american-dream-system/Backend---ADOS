const express = require("express");
const router = express.Router();
const { protectGuest, allowedTo } = require("../../middlewares/authMiddleware");
const { uploadSingleImage, imageProcessing } = require("../../middlewares/uploadImages");
const { getRestaurantHome, setImage, setTexts } = require("./services");

const adminOnly = [protectGuest, allowedTo("admin")];
// Names the stored file after the page and slot (the upload middleware reads page/section from the body)
const nameFile = (req, res, next) => {
    req.body = req.body || {};
    req.body.page = "restaurant-home";
    req.body.section = req.params.slot;
    next();
};

// Public: the Restaurant & Cafe home page reads this
router.get("/", getRestaurantHome);

// Admin only
router.put("/texts", adminOnly, setTexts);
router.put("/images/:slot", adminOnly, uploadSingleImage("image"), nameFile, imageProcessing, setImage);
router.delete("/images/:slot", adminOnly, setImage);

module.exports = router;
