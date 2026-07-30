import Notification from "../models/notification.model.js";
import { emitToUser } from "../config/socket.js";
import logger from "../utils/logger.js";

const notificationService = {
  createNotification: async ({ recipientId, senderId = null, type, title, message, link = "", metadata = {} }) => {
    try {
      const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        title,
        message,
        link,
        metadata,
      });

      // Populate sender info if exists
      const populated = await Notification.findById(notification._id)
        .populate("senderId", "name email avatar");

      // Emit socket realtime event to recipient
      emitToUser(recipientId.toString(), "notification_new", populated);

      return populated;
    } catch (error) {
      logger.error("Lỗi tạo thông báo:", error);
      throw error;
    }
  },

  getNotifications: async (userId, page = 1, limit = 15, unreadOnly = false) => {
    const query = { recipientId: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("senderId", "name email avatar"),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  },

  markAsRead: async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { returnDocument: "after" }
    );
    return notification;
  },

  markAllAsRead: async (userId) => {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return { success: true };
  },

  deleteNotification: async (notificationId, userId) => {
    await Notification.deleteOne({ _id: notificationId, recipientId: userId });
    return { success: true };
  },
};

export default notificationService;
