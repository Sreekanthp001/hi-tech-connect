const prisma = require('../config/prisma');

// 1. Get all notifications for the current user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        });
        res.json(notifications);
    } catch (err) {
        console.error("Notification error", err);
        res.json([]);
    }
};

// 2. Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: "Notification not found" });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 3. Mark all notifications as read for the current user
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
