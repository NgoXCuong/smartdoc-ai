import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";
import Message from "../models/message.model.js";
import ChatSession from "../models/chatSession.model.js";
import logger from "../utils/logger.js";
import { logUsage } from "../config/usage.js";

const chatService = {
  expandQuery: async (query) => {
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        temperature: 0.1,
      });
      const prompt = `Bạn là một chuyên gia tìm kiếm. Hãy viết 2 phiên bản khác của câu hỏi sau (bằng Tiếng Việt) để giúp tìm kiếm tài liệu chính xác hơn. Tập trung vào các từ khóa chính. Chỉ trả về danh sách các câu hỏi, mỗi câu một dòng. Không đánh số.
      Câu hỏi: "${query}"`;
      const res = await model.invoke(prompt);
      const variations = res.content.split("\n").map(q => q.trim()).filter(q => q !== "");
      return [query, ...variations];
    } catch (error) {
      logger.error("[ChatService] Query expansion failed:", error);
      return [query];
    }
  },

  rerankChunks: async (query, chunks) => {
    if (chunks.length <= 5) return chunks;
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        temperature: 0,
      });
      
      const chunksText = chunks.map((c, i) => `[ID ${i}]: ${c.pageContent.substring(0, 300)}...`).join("\n\n");
      const prompt = `Bạn là một chuyên gia đánh giá tài liệu. Dựa trên câu hỏi của người dùng, hãy chọn ra 5 đoạn văn bản liên quan nhất từ danh sách bên dưới.
      Câu hỏi: "${query}"
      
      Danh sách các đoạn:
      ${chunksText}
      
      Yêu cầu: Chỉ trả về danh sách ID của các đoạn được chọn, cách nhau bằng dấu phẩy (Ví dụ: 0, 2, 5). Không giải thích gì thêm.`;
      
      const res = await model.invoke(prompt);
      const selectedIds = res.content.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      const reranked = selectedIds
        .map(id => chunks[id])
        .filter(c => c !== undefined)
        .slice(0, 6);
        
      return reranked.length > 0 ? reranked : chunks.slice(0, 6);
    } catch (error) {
      logger.error("[ChatService] Re-ranking failed:", error);
      return chunks.slice(0, 6);
    }
  },

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

    // 1. Query Expansion
    const queries = await chatService.expandQuery(question);
    logger.info(`[ChatService] Expanded queries: ${queries.join(" | ")}`);

    // 2. Hybrid Search (Run searches for all query variations)
    let allChunks = [];
    for (const q of queries) {
      const result = await vectorStore.similaritySearch(q, 5, {
        preFilter: {
          "source": {
            $in: docIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      });
      allChunks = [...allChunks, ...result];
    }

    // Deduplicate chunks based on content or metadata.id
    const uniqueChunks = [];
    const seen = new Set();
    for (const chunk of allChunks) {
      const id = chunk.metadata?._id?.toString() || chunk.pageContent;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueChunks.push(chunk);
      }
    }

    logger.info(`[ChatService] Lấy được ${uniqueChunks.length} chunks độc nhất từ expansion.`);

    // 3. Re-ranking
    const finalChunks = await chatService.rerankChunks(question, uniqueChunks);
    logger.info(`[ChatService] Sau re-ranking: còn ${finalChunks.length} chunks.`);

    return finalChunks;
  },

  generateAnswer: async (question, chunks, history = []) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing in environment variables");
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-flash-latest",
      maxOutputTokens: 2048,
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
    1. Trả lời câu hỏi một cách trung thực, đầy đủ và chi tiết dựa vào Ngữ cảnh và Lịch sử hội thoại.
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

  generateStreamingAnswer: async (question, chunks, history = []) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing");
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-flash-latest",
      maxOutputTokens: 2048,
      temperature: 0.3,
      streaming: true,
    });

    const formattedHistory = history
      .map((m) => `${m.role === "user" ? "Người dùng" : "Trợ lý"}: ${m.content}`)
      .join("\n");

    const context = chunks
      .map((c, i) => {
        const fileName = c.metadata?.fileName || c.fileName;
        const pageNumber = c.metadata?.pageNumber || c.pageNumber || "N/A";
        return `[Nguồn ${i + 1}] (Tài liệu: ${fileName}, Trang: ${pageNumber}):\n${c.pageContent}`;
      })
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
    1. Trả lời câu hỏi một cách trung thực, đầy đủ và chi tiết dựa vào Ngữ cảnh và Lịch sử hội thoại.
    2. LUÔN trích dẫn nguồn theo định dạng [X, trang Y] ở cuối câu hoặc đoạn liên quan (Ví dụ: [1, trang 5]).
    3. Nếu nội dung không có thông tin này, hãy nói rằng "Tôi không tìm thấy thông tin trong tài liệu".
    4. Trình bày bằng Tiếng Việt rõ ràng.
    `;

    return await model.stream(prompt);
  },

  prepareAsk: async (question, docIds, userId, sessionId = null) => {
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
    return { sessionId: currentSessionId, chunks };
  },

  saveChatMessages: async (question, answer, chunks, userId, sessionId) => {
    const startTime = Date.now();
    await Message.create({
      sessionId,
      role: "assistant",
      content: answer,
      metadata: {
        sources: chunks.map((c) => ({
          docId: c.metadata?.source || c.source,
          fileName: c.metadata?.fileName || c.fileName,
          pageNumber: c.metadata?.pageNumber || c.pageNumber,
          pageContent: c.pageContent.substring(0, 200) + "...",
        })),
      },
    });

    // Log usage (Ước tính token: 1 token ~ 4 ký tự tiếng Việt/Anh)
    const totalTokens = Math.ceil((question.length + answer.length) / 4);
    await logUsage({
      userId,
      type: "chat",
      tokens: totalTokens,
      processingTime: Date.now() - startTime,
      metadata: { sessionId }
    });
  },

  askDocument: async (question, docIds, userId, sessionId = null) => {
    const { sessionId: currentSessionId, chunks } = await chatService.prepareAsk(question, docIds, userId, sessionId);
    
    let history = await Message.find({ sessionId: currentSessionId })
      .sort({ createdAt: -1 })
      .skip(1) // Bỏ qua câu hỏi vừa lưu
      .limit(6);
    history.reverse();

    const apiResponse = await chatService.generateAnswer(question, chunks, history);

    await chatService.saveChatMessages(question, apiResponse, chunks, userId, currentSessionId);

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

  updateSession: async (sessionId, userId, updateData) => {
    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: updateData },
      { returnDocument: 'after' },
    );
    if (!session) {
      throw new Error("Không tìm thấy lịch sử trò chuyện để cập nhật");
    }
    return session;
  },

  deleteSession: async (sessionId, userId) => {
    const session = await ChatSession.findOneAndDelete({ _id: sessionId, userId });
    if (!session) {
      throw new Error("Không tìm thấy lịch sử trò chuyện để xóa");
    }
    // Xóa tất cả tin nhắn liên quan
    await Message.deleteMany({ sessionId });
    return session;
  },

  getAllChatByUser: async (userId) => {
    const sessions = await ChatSession.find({ userId }).sort({
      isPinned: -1,
      updatedAt: -1,
    });

    // Trả về mảng rỗng nếu không có lịch sử thay vì ném lỗi
    return sessions || [];
  },
};

export default chatService;
