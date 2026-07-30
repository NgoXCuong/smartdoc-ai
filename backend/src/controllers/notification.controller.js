import notificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page, limit, unreadOnly } = req.query;

  const result = await notificationService.getNotifications(
    userId,
    page,
    limit,
    unreadOnly === "true"
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id, userId);

  return res.status(200).json({
    success: true,
    message: "Đã đánh dấu là đã đọc",
    notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await notificationService.markAllAsRead(userId);

  return res.status(200).json({
    success: true,
    message: "Đã đánh dấu tất cả là đã đọc",
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  await notificationService.deleteNotification(id, userId);

  return res.status(200).json({
    success: true,
    message: "Đã xóa thông báo",
  });
});
