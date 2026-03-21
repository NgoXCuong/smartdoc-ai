import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import mongoose from "mongoose";
import Message from "../models/message.model.js";
import ChatSession from "../models/chatSession.model.js";

const chatService = {
  performRAG: async (question, docId) => {
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
      preFilter: { "metadata.source": new mongoose.Types.ObjectId(docId) },
    });

    console.log(`[ChatService] Tìm thấy ${result.length} chunks liên quan cho docId: ${docId}`);

    const context = result.map((r) => r.pageContent).join("\n\n");

    return context;
  },

  generateAnswer: async (question, context) => {
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-flash-latest",
      maxOutputTokens: 1000,
    });

    const prompt = `
    Bạn là một trợ lý ảo thông minh. Dưới đây là nội dung trích xuất từ tài liệu của người dùng:
    ---
    ${context}
    ---
    Câu hỏi: "${question}"
    
    Hãy dựa vào nội dung trên để trả lời câu hỏi một cách trung thực và ngắn gọn. 
    Nếu nội dung không có thông tin này, hãy nói rằng "Tôi không tìm thấy thông tin trong tài liệu".
  `;

    try {
      const response = await model.invoke(prompt);
      return response.content;
    } catch (error) {
      if (error.message.includes("429")) {
        throw new Error("AI đang bị quá tải (Quota exceeded). Vui lòng thử lại sau vài giây.");
      }
      throw error;
    }
  },

  askDocument: async (question, docId, userId, sessionId = null) => {
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await ChatSession.create({
        userId, docId, title: question.substring(0, 50)
      });

      currentSessionId = newSession._id;
    }

    await Message.create({ sessionId: currentSessionId, role: 'user', content: question });

    const context = await chatService.performRAG(question, docId);

    const apiResponse = await chatService.generateAnswer(question, context);

    await Message.create({ sessionId: currentSessionId, role: 'assistant', content: apiResponse });

    return {
      sessionId: currentSessionId,
      message: apiResponse,
    };
  },

  getChatHistory: async (sessionId, userId) => {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error("Không tìm thấy lịch sử trò chuyện");
    }

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    return messages;
  }
};

export default chatService;
