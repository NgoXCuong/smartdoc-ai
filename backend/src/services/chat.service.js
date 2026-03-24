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
      metadataKey: "metadata",
    });

    const result = await vectorStore.similaritySearch(question, 4, {
      preFilter: {
        "metadata.source": {
          $in: docIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    });

    logger.info(
      `[ChatService] Tìm thấy ${result.length} chunks liên quan cho docIds: ${docIds.join(", ")}`,
    );

    return result; // Trả về mảng chunks để xử lý trích dẫn
  },

  generateAnswer: async (question, chunks) => {
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-flash-latest",
      maxOutputTokens: 1000,
    });

    // Tạo ngữ cảnh kèm số thứ tự nguồn
    const context = chunks
      .map(
        (c, i) =>
          `[Nguồn ${i + 1}] (Tài liệu: ${c.metadata.fileName}):\n${c.pageContent}`,
      )
      .join("\n\n---\n\n");

    const prompt = `
    Bạn là một trợ lý ảo thông minh chuyên phân tích tài liệu.
    Dưới đây là nội dung trích xuất từ tài liệu của người dùng:
    ---
    ${context}
    ---
    Câu hỏi: "${question}"
    
    YÊU CẦU:
    1. Trả lời câu hỏi một cách trung thực và ngắn gọn dựa vào tài liệu.
    2. Nếu sử dụng thông tin từ [Nguồn X], hãy ghi chú [X] ở cuối câu hoặc đoạn liên quan.
    3. Nếu nội dung không có thông tin này, hãy nói rằng "Tôi không tìm thấy thông tin trong tài liệu".
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
    if (!currentSessionId) {
      const newSession = await ChatSession.create({
        userId,
        docIds,
        title: question.substring(0, 50),
      });

      currentSessionId = newSession._id;
    }

    await Message.create({
      sessionId: currentSessionId,
      role: "user",
      content: question,
    });

    const chunks = await chatService.performRAG(question, docIds);

    const apiResponse = await chatService.generateAnswer(question, chunks);

    // Lưu tin nhắn trợ lý kèm metadata nguồn
    await Message.create({
      sessionId: currentSessionId,
      role: "assistant",
      content: apiResponse,
      metadata: {
        sources: chunks.map((c) => ({
          docId: c.metadata.source,
          fileName: c.metadata.fileName,
          pageContent: c.pageContent.substring(0, 200) + "...",
        })),
      },
    });

    return {
      sessionId: currentSessionId,
      message: apiResponse,
      sources: chunks.map((c, i) => ({
        index: i + 1,
        fileName: c.metadata.fileName,
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

    if (!sessions || sessions.length === 0) {
      throw new Error("Lịch sử chat không tồn tại");
    }

    return sessions;
  },
};

export default chatService;
