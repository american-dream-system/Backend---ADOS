const express = require("express");
const router = express.Router();
const { protectGuest, allowedTo } = require("../../middlewares/authMiddleware");
const { uploadSingleImage, imageProcessing } = require("../../middlewares/uploadImages");
const {
    getAll,
    createTable,
    updateTable,
    deleteTable,
    createCategory,
    renameCategory,
    reorderCategories,
    deleteCategory,
} = require("./services");

const adminOnly = [protectGuest, allowedTo("admin")];
// Names the stored photo after the page (the upload middleware reads page/section from the body)
const nameFile = (req, res, next) => {
    req.body = req.body || {};
    req.body.page = "restaurant-table";
    req.body.section = "photo";
    next();
};
const photo = [uploadSingleImage("image"), nameFile, imageProcessing];

// Public: the Book a Table page reads this (categories + tables)
router.get("/", getAll);

// Admin only: categories (fixed paths before :id)
router.post("/categories", adminOnly, createCategory);
router.put("/categories/order", adminOnly, reorderCategories);
router.put("/categories/:id", adminOnly, renameCategory);
router.delete("/categories/:id", adminOnly, deleteCategory);

// Admin only: tables
router.post("/", adminOnly, ...photo, createTable);
router.put("/:id", adminOnly, ...photo, updateTable);
router.delete("/:id", adminOnly, deleteTable);

module.exports = router;
