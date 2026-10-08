const express = require("express");
const router = express.Router();
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

// @route POST /api/menu/seed - Seed items from UI
router.post("/seed", seedMenu);

// @route GET /api/menu/categories - Categories breakdown
router.get("/categories", getCategories);

// @route GET & POST for orders
router.get("/orders", getAllOrders);
router.post("/order", placeOrderValidator, placeOrder);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);

// @route GET & POST for menu items
router.route("/")
    .get(getAllMenuItems)
    .post(uploadSingleImage("image"), resizeMenuItemImage, createMenuItemValidator, createMenuItem);

// @route GET, PUT, DELETE for specific menu item
router.route("/:id")
    .get(getMenuItemValidator, getMenuItemById)
    .put(uploadSingleImage("image"), resizeMenuItemImage, updateMenuItemValidator, updateMenuItem)
    .delete(deleteMenuItemValidator, deleteMenuItem);

module.exports = router;
