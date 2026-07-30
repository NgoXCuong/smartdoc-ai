import mongoose from "mongoose";
import WorkspaceMessage from "../models/workspaceMessage.model.js";
import Workspace from "../models/workspace.model.js";
import Document from "../models/document.model.js";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import logger from "../utils/logger.js";

const groupChatService = {
  /**
   * Kiểm tra xem user có phải thành viên của workspace không
   */
  isMember: async (workspaceId, userId) => {
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ ownerId: userId }, { "members.user": userId }],
    });
    return !!workspace;
  },

  /**
   * Lưu tin nhắn người dùng vào DB
   */
  saveMessage: async (workspaceId, senderId, content, aiMentioned = false) => {
    return await WorkspaceMessage.create({
      workspaceId,
      senderId,
      content,
      type: "text",
      aiMentioned,
    });
  },

  /**
   * Lưu phản hồi của AI vào DB
   */
  saveAIResponse: async (workspaceId, content, sources = []) => {
    return await WorkspaceMessage.create({
      workspaceId,
      // senderId = null vì đây là AI
      senderId: null,
      content,
      type: "ai_response",
      sources,
    });
  },

  /**
   * Xử lý khi user mention @AI trong group chat.
   * AI sẽ RAG trong tất cả tài liệu của workspace đó.
   */
  handleAIMention: async (workspaceId, question) => {
    try {
      // Lấy tất cả docIds đã "completed" trong workspace này
      const docs = await Document.find(
        { workspaceId, status: "completed" },
        "_id"
      );

      if (docs.length === 0) {
        return {
          content:
            "ℹ️ Workspace này chưa có tài liệu nào được xử lý. Vui lòng tải lên tài liệu trước.",
          sources: [],
        };
      }

      const docIds = docs.map((d) => d._id);

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-embedding-001",
      });

      const collection = mongoose.connection.db.collection("document_chunks");
      const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
      });

      // Vector search trong toàn bộ tài liệu của workspace
      const objectDocIds = docIds.map((id) => new mongoose.Types.ObjectId(id));
      const stringDocIds = docIds.map((id) => id.toString());

      let chunks = [];
      try {
        chunks = await vectorStore.similaritySearch(question, 5, {
          preFilter: {
            $or: [
              { source: { $in: objectDocIds } },
              { docId: { $in: objectDocIds } },
              { "metadata.source": { $in: objectDocIds } },
              { "metadata.docId": { $in: objectDocIds } },
              { source: { $in: stringDocIds } },
              { docId: { $in: stringDocIds } },
              { "metadata.source": { $in: stringDocIds } },
              { "metadata.docId": { $in: stringDocIds } }
            ]
          },
        });
      } catch (vectorErr) {
        logger.warn("[GroupChat] Vector search error:", vectorErr);
      }

      // Fallback truy vấn DB trực tiếp nếu vector search trả về 0 chunks
      if (chunks.length === 0) {
        logger.info("[GroupChat] Vector search trả về 0 chunks, tiến hành truy vấn trực tiếp từ MongoDB...");
        const rawChunks = await collection.find({
          $or: [
            { docId: { $in: objectDocIds } },
            { source: { $in: objectDocIds } },
            { "metadata.docId": { $in: objectDocIds } },
            { "metadata.source": { $in: objectDocIds } },
            { docId: { $in: stringDocIds } },
            { source: { $in: stringDocIds } },
            { "metadata.docId": { $in: stringDocIds } },
            { "metadata.source": { $in: stringDocIds } }
          ]
        }).limit(15).toArray();

        chunks = rawChunks.map(rc => ({
          pageContent: rc.text || rc.pageContent || "",
          metadata: {
            fileName: rc.fileName || rc.metadata?.fileName || "Tài liệu",
            pageNumber: rc.pageNumber || rc.metadata?.pageNumber || 1,
            source: rc.docId || rc.source || rc.metadata?.docId || rc.metadata?.source,
            ...rc.metadata
          }
        })).filter(c => c.pageContent);
      }

      if (chunks.length === 0) {
        return {
          content:
            "🔍 Tôi không tìm thấy thông tin liên quan trong các tài liệu của workspace.",
          sources: [],
        };
      }

      // Xây dựng context từ các chunks tìm được
      const context = chunks
        .map((c, i) => {
          const fileName = c.metadata?.fileName || "Tài liệu";
          const pageNumber = c.metadata?.pageNumber || "N/A";
          return `[Nguồn ${i + 1}] (${fileName}, Trang: ${pageNumber}):\n${c.pageContent}`;
        })
        .join("\n\n---\n\n");

      // Gọi AI sinh câu trả lời
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        maxOutputTokens: 1024,
        temperature: 0.3,
      });

      const prompt = `Bạn là trợ lý AI trong một nhóm chat của công ty.
      
Một thành viên đã hỏi: "${question}"

Dưới đây là thông tin trích xuất từ các tài liệu của nhóm:
---
${context}
---

Hãy trả lời ngắn gọn, rõ ràng và hữu ích. Trích dẫn nguồn theo định dạng [Tên file, trang X] nếu có. 
Nếu không đủ thông tin, hãy nói thẳng.`;

      const response = await model.invoke(prompt);

      const sources = chunks.map((c) => ({
        docId: c.metadata?.source,
        fileName: c.metadata?.fileName,
        pageNumber: c.metadata?.pageNumber,
      }));

      return {
        content: response.content,
        sources,
      };
    } catch (error) {
      logger.error("[GroupChat] Lỗi khi xử lý AI mention:", error);
      return {
        content:
          "⚠️ AI gặp sự cố khi trả lời. Vui lòng thử lại sau.",
        sources: [],
      };
    }
  },

  /**
   * Lấy lịch sử tin nhắn theo workspace (có phân trang, cursor-based)
   */
  getMessageHistory: async (workspaceId, userId, page = 1, limit = 30) => {
    // Kiểm tra quyền thành viên
    const isMember = await groupChatService.isMember(workspaceId, userId);
    if (!isMember) {
      throw new Error("Bạn không có quyền xem lịch sử chat của workspace này");
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      WorkspaceMessage.find({ workspaceId, isDeleted: false })
        .sort({ createdAt: -1 }) // Mới nhất trước (client sẽ reverse để hiển thị)
        .skip(skip)
        .limit(Number(limit))
        .populate("senderId", "username email avatar"),
      WorkspaceMessage.countDocuments({ workspaceId, isDeleted: false }),
    ]);

    return {
      messages: messages.reverse(), // Trả về theo thứ tự thời gian tăng dần
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalMessages: total,
      hasMore: skip + messages.length < total,
    };
  },

  /**
   * Xóa tin nhắn (chỉ người gửi mới xóa được — soft delete)
   */
  deleteMessage: async (messageId, userId) => {
    const message = await WorkspaceMessage.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      throw new Error(
        "Tin nhắn không tồn tại hoặc bạn không có quyền xóa"
      );
    }

    message.isDeleted = true;
    message.content = "Tin nhắn đã bị xóa";
    await message.save();
    return message;
  },
};

export default groupChatService;
