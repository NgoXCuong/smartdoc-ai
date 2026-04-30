import chatService from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const askDocument = asyncHandler(async (req, res) => {
  const { question, docIds, sessionId, stream } = req.body;
  const userId = req.user.userId;

  if (!question || !docIds || (Array.isArray(docIds) && docIds.length === 0)) {
    throw new ApiError(400, "Thiếu câu hỏi hoặc danh sách ID tài liệu");
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const { sessionId: sId, chunks } = await chatService.prepareAsk(question, Array.isArray(docIds) ? docIds : [docIds], userId, sessionId);
    
    res.write(`data: ${JSON.stringify({ type: 'metadata', sessionId: sId, chunks })}\n\n`);

    const messageHistory = await chatService.getChatHistory(sId, userId);
    const streamResponse = await chatService.generateStreamingAnswer(question, chunks, messageHistory);

    let fullContent = "";
    for await (const chunk of streamResponse) {
      const content = chunk.content;
      fullContent += content;
      res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
    }

    await chatService.saveChatMessages(question, fullContent, chunks, userId, sId);
    
    res.write(`data: [DONE]\n\n`);
    return res.end();
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

export const updateChatSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId;
  const updateData = req.body;

  const session = await chatService.updateSession(sessionId, userId, updateData);
  return res.status(200).json({
    success: true,
    message: "Cập nhật cuộc trò chuyện thành công",
    session,
  });
});

export const deleteChatSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId;

  await chatService.deleteSession(sessionId, userId);
  return res.status(200).json({
    success: true,
    message: "Xóa cuộc trò chuyện thành công",
  });
});
