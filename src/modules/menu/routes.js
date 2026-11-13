const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { ownRecord, byId, byCode, ownGuestParam, ownGuestTarget } = require("../../middlewares/ownership");
const menuOrderModel = require("./orderModel");
const findOrder = async (req) => {
    const id = String(req.params.id || "").trim().replace(/^#/, "");
    return /^[0-9a-fA-F]{24}$/.test(id) ? menuOrderModel.findById(id).lean() : menuOrderModel.findOne({ orderCode: id }).lean();
};
const ownOrder = { guestFields: ["guest", "user"], phoneFields: ["customerPhone"] };
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
router.get("/orders", adminOnly, getAllOrders);
router.post(
    "/order",
    uploadSingleImage("paymentProof"),
    resizePaymentProofImage,
    placeOrderValidator,
    placeOrder
);
router.get("/orders/:id", ownRecord(findOrder, ownOrder), getOrderById);
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
