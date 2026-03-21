import chatService from "../services/chat.service.js";

export const askDocument = async (req, res) => {
  try {
    const { question, docId, sessionId } = req.body;
    const userId = req.user.userId;

    if (!question || !docId) {
      return res
        .status(400)
        .json({ message: "Thiếu câu hỏi hoặc ID tài liệu" });
    }

    const answer = await chatService.askDocument(question, docId, userId, sessionId);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
}
