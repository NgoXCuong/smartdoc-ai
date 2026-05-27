import groupChatService from "../services/groupChat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * GET /api/workspaces/:id/chat?page=1&limit=30
 * Lấy lịch sử tin nhắn group chat của workspace (có phân trang)
 */
export const getGroupChatHistory = asyncHandler(async (req, res) => {
  const { id: workspaceId } = req.params;
  const { page = 1, limit = 30 } = req.query;
  const userId = req.user.userId;

  const result = await groupChatService.getMessageHistory(
    workspaceId,
    userId,
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * DELETE /api/workspaces/:id/chat/:messageId
 * Xóa tin nhắn (soft delete, chỉ chủ sở hữu tin nhắn mới xóa được)
 */
export const deleteGroupChatMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  if (!messageId) {
    throw new ApiError(400, "messageId là bắt buộc");
  }

  const message = await groupChatService.deleteMessage(messageId, userId);

  return res.status(200).json({
    success: true,
    message: "Đã xóa tin nhắn",
    data: message,
  });
});
