import { success } from "zod";
import chatService from "../services/chat.service.js";

export const askDocument = async (req, res) => {
  try {
    const { question, docIds, sessionId } = req.body;
    const userId = req.user.userId;

    if (!question || !docIds || (Array.isArray(docIds) && docIds.length === 0)) {
      return res
        .status(400)
        .json({ message: "Thiếu câu hỏi hoặc danh sách ID tài liệu" });
    }

    const answer = await chatService.askDocument(
      question,
      Array.isArray(docIds) ? docIds : [docIds],
      userId,
      sessionId,
    );
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllChatByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await chatService.getAllChatByUser(userId);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách lịch sử thành công",
      sessions,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const history = await chatService.getChatHistory(sessionId, userId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
