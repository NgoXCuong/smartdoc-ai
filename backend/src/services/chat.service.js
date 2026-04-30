import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import mongoose from "mongoose";
import Message from "../models/message.model.js";
import ChatSession from "../models/chatSession.model.js";
import logger from "../utils/logger.js";

const chatService = {
  performRAG: async (question, docIds) => {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-embedding-001",
    });

    const collection = mongoose.connection.db.collection("documents");
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: "vector_index",
      textKey: "text",
      embeddingKey: "embedding",
    });

    const result = await vectorStore.similaritySearch(question, 4, {
      preFilter: {
        "source": {
          $in: docIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    });

    logger.info(
      `[ChatService] Tìm thấy ${result.length} chunks liên quan cho docIds: ${docIds.join(", ")}`,
    );

    return result; // Trả về mảng chunks để xử lý trích dẫn
  },

  generateAnswer: async (question, chunks, history = []) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing in environment variables");
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-flash-latest",
      maxOutputTokens: 1000,
      temperature: 0.3,
    });

    // Định dạng lịch sử hội thoại
    const formattedHistory = history
      .map((m) => `${m.role === "user" ? "Người dùng" : "Trợ lý"}: ${m.content}`)
      .join("\n");

    // Tạo ngữ cảnh kèm số thứ tự nguồn và trang
    const context = chunks
      .map(
        (c, i) => {
          const fileName = c.metadata?.fileName || c.fileName;
          const pageNumber = c.metadata?.pageNumber || c.pageNumber || "N/A";
          return `[Nguồn ${i + 1}] (Tài liệu: ${fileName}, Trang: ${pageNumber}):\n${c.pageContent}`;
        }
      )
      .join("\n\n---\n\n");

    const prompt = `
    Bạn là một trợ lý ảo thông minh chuyên phân tích tài liệu.
    
    LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
    ---
    ${formattedHistory || "Chưa có lịch sử hội thoại."}
    ---

    NỘI DUNG TRÍCH XUẤT TỪ TÀI LIỆU (NGỮ CẢNH):
    ---
    ${context}
    ---

    CÂU HỎI HIỆN TẠI: "${question}"
    
    YÊU CẦU:
    1. Trả lời câu hỏi một cách trung thực và ngắn gọn dựa vào Ngữ cảnh và Lịch sử hội thoại.
    2. LUÔN trích dẫn nguồn theo định dạng [X, trang Y] ở cuối câu hoặc đoạn liên quan (Ví dụ: [1, trang 5]).
    3. Nếu nội dung không có thông tin này, hãy nói rằng "Tôi không tìm thấy thông tin trong tài liệu".
    4. Trình bày bằng Tiếng Việt rõ ràng.
  `;

    try {
      const response = await model.invoke(prompt);
      return response.content;
    } catch (error) {
      if (error.message.includes("429")) {
        throw new Error(
          "AI đang bị quá tải (Quota exceeded). Vui lòng thử lại sau vài giây.",
        );
      }
      throw error;
    }
  },

  askDocument: async (question, docIds, userId, sessionId = null) => {
    let currentSessionId = sessionId;
    let history = [];

    if (!currentSessionId) {
      const newSession = await ChatSession.create({
        userId,
        docIds,
        title: question.substring(0, 50),
      });
      currentSessionId = newSession._id;
    } else {
      // Lấy 6 tin nhắn gần nhất để làm context
      history = await Message.find({ sessionId: currentSessionId })
        .sort({ createdAt: -1 })
        .limit(6);
      history.reverse(); // Đảo lại theo thứ tự thời gian tăng dần
    }

    await Message.create({
      sessionId: currentSessionId,
      role: "user",
      content: question,
    });

    const chunks = await chatService.performRAG(question, docIds);

    const apiResponse = await chatService.generateAnswer(question, chunks, history);

    // Lưu tin nhắn trợ lý kèm metadata nguồn và trang
    await Message.create({
      sessionId: currentSessionId,
      role: "assistant",
      content: apiResponse,
      metadata: {
        sources: chunks.map((c) => ({
          docId: c.metadata?.source || c.source,
          fileName: c.metadata?.fileName || c.fileName,
          pageNumber: c.metadata?.pageNumber || c.pageNumber,
          pageContent: c.pageContent.substring(0, 200) + "...",
        })),
      },
    });

    return {
      sessionId: currentSessionId,
      message: apiResponse,
      sources: chunks.map((c, i) => ({
        index: i + 1,
        fileName: c.metadata?.fileName || c.fileName,
        pageNumber: c.metadata?.pageNumber || c.pageNumber,
      })),
    };
  },

  getChatHistory: async (sessionId, userId) => {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error("Không tìm thấy lịch sử trò chuyện");
    }

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    return messages;
  },

  getAllChatByUser: async (userId) => {
    const sessions = await ChatSession.find({ userId }).sort({
      createdAt: -1,
    });

    // Trả về mảng rỗng nếu không có lịch sử thay vì ném lỗi
    return sessions || [];
  },
};

export default chatService;
