const express = require("express");
const router = express.Router();

const {
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
} = require("./services");

// List notifications with pagination & filtering
router.get("/", getAllNotifications);

// Get unread badge count
router.get("/unread-count", getUnreadCount);

// Mark all as read
router.patch("/mark-all-read", markAllAsRead);

// Mark single as read
router.patch("/:id/read", markAsRead);

// Clear all notifications
router.delete("/clear-all", clearAllNotifications);

// Delete single notification
router.delete("/:id", deleteNotification);

module.exports = router;
