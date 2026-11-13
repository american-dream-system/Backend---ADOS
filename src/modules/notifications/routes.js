const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");

const {
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
} = require("./services");

// List notifications with pagination & filtering
router.get("/", adminOnly, getAllNotifications);

// Get unread badge count
router.get("/unread-count", adminOnly, getUnreadCount);

// Mark all as read
router.patch("/mark-all-read", adminOnly, markAllAsRead);

// Mark single as read
router.patch("/:id/read", adminOnly, markAsRead);

// Clear all notifications
router.delete("/clear-all", adminOnly, clearAllNotifications);

// Delete single notification
router.delete("/:id", adminOnly, deleteNotification);

module.exports = router;
