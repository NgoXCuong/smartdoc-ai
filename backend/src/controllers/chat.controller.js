import chatService from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const askDocument = asyncHandler(async (req, res) => {
  const { question, docIds, sessionId } = req.body;
  const userId = req.user.userId;

  if (!question || !docIds || (Array.isArray(docIds) && docIds.length === 0)) {
    throw new ApiError(400, "Thiếu câu hỏi hoặc danh sách ID tài liệu");
  }

  const answer = await chatService.askDocument(
    question,
    Array.isArray(docIds) ? docIds : [docIds],
    userId,
    sessionId,
  );
  return res.status(200).json({
    success: true,
    answer,
  });
});

export const getAllChatByUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const sessions = await chatService.getAllChatByUser(userId);
  return res.status(200).json({
    success: true,
    message: "Lấy danh sách lịch sử thành công",
    sessions,
  });
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId;

  const history = await chatService.getChatHistory(sessionId, userId);
  return res.status(200).json({
    success: true,
    history,
  });
});
