const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { uploadSingleImage } = require("../../middlewares/uploadImages");
const {
    resizeMenuItemImage,
    seedMenu,
    createMenuItem,
    getAllMenuItems,
    getCategories,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    placeOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus
} = require("./services");

const {
    createMenuItemValidator,
    getMenuItemValidator,
    updateMenuItemValidator,
    deleteMenuItemValidator,
    placeOrderValidator
} = require("./validator");

const { resizePaymentProofImage } = require("../buying/services");

// @route POST /api/menu/seed - Seed items from UI
router.post("/seed", adminOnly, seedMenu);

// @route GET /api/menu/categories - Categories breakdown
router.get("/categories", getCategories);

// @route GET & POST for orders
router.get("/orders", getAllOrders);
router.post(
    "/order",
    uploadSingleImage("paymentProof"),
    resizePaymentProofImage,
    placeOrderValidator,
    placeOrder
);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", adminOnly, updateOrderStatus);

// @route GET & POST for menu items
router.route("/")
    .get(getAllMenuItems)
    .post(adminOnly, uploadSingleImage("image"), resizeMenuItemImage, createMenuItemValidator, createMenuItem);

// @route GET, PUT, DELETE for specific menu item
router.route("/:id")
    .get(getMenuItemValidator, getMenuItemById)
    .put(adminOnly, uploadSingleImage("image"), resizeMenuItemImage, updateMenuItemValidator, updateMenuItem)
    .delete(adminOnly, deleteMenuItemValidator, deleteMenuItem);

module.exports = router;
