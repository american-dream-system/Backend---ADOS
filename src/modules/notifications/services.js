const Notification = require("./model");
const { emitToAdmin } = require("../../config/socket");
const ApiError = require("../../utils/ApiError");

/**
 * Helper to create a notification in DB and broadcast via Socket.io
 * @param {object} param0 
 * @returns {Promise<object>}
 */
const createAndEmitNotification = async ({
    title,
    message,
    type = "playzone_order",
    orderCode,
    orderId,
    orderModelRef = "Buying",
    customerName,
    customerPhone,
    amount = 0,
    metadata = {}
}) => {
    try {
        const doc = await Notification.create({
            title,
            message,
            type,
            orderCode,
            orderId,
            orderModelRef,
            customerName: customerName || "عميل",
            customerPhone: customerPhone || "",
            amount: Number(amount) || 0,
            isRead: false,
            metadata
        });

        const payload = {
            notification: doc,
            order: metadata.order || null,
            type,
            orderCode,
            customerName: doc.customerName,
            amount: doc.amount,
            createdAt: doc.createdAt
        };

        // Broadcast to admin room and global socket listeners
        emitToAdmin("NEW_ORDER_NOTIFICATION", payload);
        emitToAdmin("NEW_NOTIFICATION", doc);

        console.log(`[Notification] Created & broadcasted: [${type}] ${orderCode || ''} - ${title}`);
        return doc;
    } catch (err) {
        console.error("[Notification] Error creating notification:", err.message);
        return null;
    }
};

/**
 * Get paginated list of notifications
 * GET /api/notifications
 */
const getAllNotifications = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.type && req.query.type !== "all") {
            filter.type = req.query.type;
        }
        if (req.query.isRead !== undefined) {
            filter.isRead = req.query.isRead === "true";
        }

        const [notifications, totalCount, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ isRead: false })
        ]);

        return res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit) || 1,
                unreadCount
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get count of unread notifications
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const unreadCount = await Notification.countDocuments({ isRead: false });
        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return next(new ApiError("لم يتم العثور على الإشعار المطلوب", 404));
        }

        const unreadCount = await Notification.countDocuments({ isRead: false });

        return res.status(200).json({
            success: true,
            message: "تم تحديث حالة الإشعار إلى مقروء",
            data: notification,
            unreadCount
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            message: "تم تمييز جميع الإشعارات كمقروءة بنجاح",
            modifiedCount: result.modifiedCount,
            unreadCount: 0
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await Notification.findByIdAndDelete(id);
        if (!deleted) {
            return next(new ApiError("لم يتم العثور على الإشعار", 404));
        }

        const unreadCount = await Notification.countDocuments({ isRead: false });
        return res.status(200).json({
            success: true,
            message: "تم حذف الإشعار بنجاح",
            unreadCount
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Clear all notifications (or all read notifications)
 * DELETE /api/notifications/clear-all
 */
const clearAllNotifications = async (req, res, next) => {
    try {
        const onlyRead = req.query.onlyRead === "true";
        const filter = onlyRead ? { isRead: true } : {};
        const result = await Notification.deleteMany(filter);

        const unreadCount = await Notification.countDocuments({ isRead: false });
        return res.status(200).json({
            success: true,
            message: onlyRead ? "تم مسح الإشعارات المقروءة" : "تم مسح جميع الإشعارات",
            deletedCount: result.deletedCount,
            unreadCount
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createAndEmitNotification,
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
};
