import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";
import Document from "../models/document.model.js";
import Message from "../models/message.model.js";
import ChatSession from "../models/chatSession.model.js";
import Workspace from "../models/workspace.model.js";
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
      logger.error("[ChatService] Lỗi khi mở rộng truy vấn:", error);
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
      logger.error("[ChatService] Việc xếp hạng lại đã thất bại:", error);
      return chunks.slice(0, 6);
    }
  },

  performRAG: async (question, docIds) => {
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

    // 1. Query Expansion
    const queries = await chatService.expandQuery(question);
    logger.info(`[ChatService] Truy vấn mở rộng: ${queries.join(" | ")}`);

    // 2. Hybrid Search (Run searches for all query variations)
    let allChunks = [];
    const objectDocIds = docIds.map((id) => new mongoose.Types.ObjectId(id));
    const stringDocIds = docIds.map((id) => id.toString());

    for (const q of queries) {
      try {
        const result = await vectorStore.similaritySearchWithScore(q, 5, {
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
        // result is array of [document, score]
        const mapped = result.map(([doc, score]) => {
          doc.similarityScore = score;
          return doc;
        });
        allChunks = [...allChunks, ...mapped];
      } catch (err) {
        logger.warn(`[ChatService] Vector search error: ${err.message}`);
      }
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

    // 2.5 Fallback: Nếu Vector Search không trả về chunks (do chưa cấu hình Atlas Vector Index hoặc sai lệch filter), truy vấn trực tiếp DB
    if (uniqueChunks.length === 0 && docIds && docIds.length > 0) {
      logger.info("[ChatService] Vector search trả về 0 chunks, tiến hành truy vấn trực tiếp từ MongoDB...");
      try {
        const lowerQuestion = question.toLowerCase();
        const isExplicitTocQuery = lowerQuestion.includes("mục lục") || lowerQuestion.includes("danh mục");

        const idFilter = {
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
        };

        // Nếu không hỏi về Mục lục, bổ sung điều kiện lọc bỏ các đoạn có nhãn TOC
        let tocFilter = {};
        if (!isExplicitTocQuery) {
          tocFilter = {
            isTOC: { $ne: true },
            sectionType: { $ne: "TOC" },
            "metadata.isTOC": { $ne: true },
            "metadata.sectionType": { $ne: "TOC" }
          };
        }

        // 1. Tách từ khóa & Cụm từ quan trọng (bỏ các từ quá phổ biến như "bài", "học", "tài", "liệu", "báo", "cáo"...)
        const commonWords = new Set(["cho", "tôi", "biết", "hỏi", "về", "là", "gì", "như", "thế", "nào", "trong", "bài", "học", "tài", "liệu", "báo", "cáo", "được", "cung", "cấp", "trang", "đề", "tài", "dự", "án"]);
        const cleanWords = question
          .toLowerCase()
          .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi, " ")
          .split(/\s+/)
          .filter(w => w.length >= 2 && !commonWords.has(w));

        // Trích xuất cả cụm 2-3 từ liên tiếp (ví dụ: "kinh nghiệm", "kết luận")
        const rawWords = question.toLowerCase().replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi, " ").split(/\s+/).filter(Boolean);
        const phrases = [];
        for (let i = 0; i < rawWords.length - 1; i++) {
          const phrase = `${rawWords[i]} ${rawWords[i + 1]}`;
          if (!phrase.includes("cho tôi") && !phrase.includes("tài liệu") && !phrase.includes("bài tập")) {
            phrases.push(phrase);
          }
        }

        const searchPatterns = [...cleanWords, ...phrases];
        let rawChunks = [];

        if (searchPatterns.length > 0) {
          const regexPattern = searchPatterns.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");

          // Quét rộng toàn bộ các chunks (giới hạn 100) để không bị hụt các trang cuối như trang 45
          rawChunks = await collection.find({
            $and: [
              idFilter,
              tocFilter,
              { text: { $regex: regexPattern, $options: "i" } }
            ]
          }).limit(100).toArray();

          // Sắp xếp các chunks: Ưu tiên cụm từ tìm kiếm chính xác & CONTENT
          rawChunks.sort((a, b) => {
            const textA = (a.text || "").toLowerCase();
            const textB = (b.text || "").toLowerCase();
            const phraseScoreA = phrases.filter(p => textA.includes(p)).length * 3 + cleanWords.filter(w => textA.includes(w)).length;
            const phraseScoreB = phrases.filter(p => textB.includes(p)).length * 3 + cleanWords.filter(w => textB.includes(w)).length;

            // Phạt nặng các chunk chứa nhiều dấu chấm nối số trang (Mục lục)
            const isTocA = a.isTOC || a.metadata?.isTOC || (textA.includes("mục lục") && textA.includes("....."));
            const isTocB = b.isTOC || b.metadata?.isTOC || (textB.includes("mục lục") && textB.includes("....."));

            if (isTocA && !isTocB) return 1;
            if (!isTocA && isTocB) return -1;
            return phraseScoreB - phraseScoreA;
          });

          // Lấy top 20 chunks phù hợp nhất cho AI
          rawChunks = rawChunks.slice(0, 20);
        }

        // Nếu không khớp từ khóa cụ thể, lấy tối đa 25 chunks nội dung đầu tiên
        if (rawChunks.length === 0) {
          rawChunks = await collection.find({
            $and: [idFilter, tocFilter]
          }).limit(25).toArray();
        }

        // Nếu vẫn không tìm được chunks nào (ví dụ file chỉ có 1 trang Mục lục), lấy toàn bộ chunks
        if (rawChunks.length === 0) {
          rawChunks = await collection.find(idFilter).limit(25).toArray();
        }

        logger.info(`[ChatService] Truy vấn trực tiếp MongoDB lấy được ${rawChunks.length} chunks thuộc loại CONTENT.`);

        for (const rc of rawChunks) {
          const pageContent = rc.text || rc.pageContent || "";
          if (!pageContent) continue;

          // Nếu không hỏi Mục lục, bỏ qua các đoạn có cấu trúc Mục lục rõ ràng
          if (!isExplicitTocQuery) {
            const isTocChunk = rc.isTOC || rc.metadata?.isTOC || rc.sectionType === "TOC" || (pageContent.includes(".....") && pageContent.toLowerCase().includes("mục lục"));
            if (isTocChunk) continue;
          }

          const id = rc._id ? rc._id.toString() : pageContent;
          if (!seen.has(id)) {
            seen.add(id);
            uniqueChunks.push({
              pageContent,
              metadata: {
                source: rc.docId || rc.source || rc.metadata?.docId || rc.metadata?.source,
                fileName: rc.fileName || rc.metadata?.fileName || "Tài liệu",
                pageNumber: rc.pageNumber || rc.metadata?.pageNumber || 1,
                sectionType: rc.sectionType || rc.metadata?.sectionType || "CONTENT",
                ...rc.metadata
              },
              similarityScore: 1
            });
          }
        }
      } catch (dbErr) {
        logger.error("[ChatService] Lỗi khi truy vấn fallback từ DB:", dbErr);
      }
    }

    // 3. Re-ranking
    const finalChunks = await chatService.rerankChunks(question, uniqueChunks);
    logger.info(`[ChatService] Sau re-ranking: còn ${finalChunks.length} chunks.`);

    return finalChunks;
  },

  generateAnswer: async (question, chunks, history = [], webContext = null) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY bị thiếu trong các biến môi trường");
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

    let webContextSection = "";
    if (webContext) {
      webContextSection = `
    NỘI DUNG TÌM KIẾM TRÊN WEB (BỔ SUNG):
    ---
    ${webContext}
    ---`;
    }

    const prompt = `
    Bạn là một trợ lý ảo thông minh chuyên phân tích tài liệu.
    
    LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
    ---
    ${formattedHistory || "Chưa có lịch sử hội thoại."}
    ---

    NỘI DUNG TRÍCH XUẤT TỪ TÀI LIỆU (NGỮ CẢNH CHÍNH):
    ---
    ${context}
    ---
    ${webContextSection}

    CÂU HỎI HIỆN TẠI: "${question}"
    
    YÊU CẦU:
    1. Trả lời câu hỏi một cách trung thực, đầy đủ và chi tiết dựa vào Ngữ cảnh từ Tài liệu và Lịch sử hội thoại.
    2. LUÔN trích dẫn nguồn theo định dạng [X, trang Y] ở cuối câu hoặc đoạn liên quan (Ví dụ: [1, trang 5]).
    3. Nếu nội dung không có trong Tài liệu, bạn CÓ THỂ sử dụng thông tin từ TÌM KIẾM TRÊN WEB (nếu có) để trả lời, nhưng PHẢI trích dẫn rõ nguồn web (Ví dụ: [Web: Tên trang]).
    4. Nếu không có thông tin từ cả 2 nguồn, hãy nói rằng "Tôi không tìm thấy thông tin".
    5. Trình bày bằng Tiếng Việt rõ ràng.
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

  generateStreamingAnswer: async (question, chunks, history = [], webContext = null) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY bị thiếu trong các biến môi trường");
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

    let webContextSection = "";
    if (webContext) {
      webContextSection = `
    NỘI DUNG TÌM KIẾM TRÊN WEB (BỔ SUNG):
    ---
    ${webContext}
    ---`;
    }

    const prompt = `
    Bạn là một trợ lý ảo thông minh chuyên phân tích tài liệu.
    
    LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
    ---
    ${formattedHistory || "Chưa có lịch sử hội thoại."}
    ---

    NỘI DUNG TRÍCH XUẤT TỪ TÀI LIỆU (NGỮ CẢNH CHÍNH):
    ---
    ${context}
    ---
    ${webContextSection}

    CÂU HỎI HIỆN TẠI: "${question}"
    
    YÊU CẦU:
    1. Trả lời câu hỏi một cách trung thực, đầy đủ và chi tiết dựa vào Ngữ cảnh từ Tài liệu và Lịch sử hội thoại.
    2. LUÔN trích dẫn nguồn theo định dạng [X, trang Y] ở cuối câu hoặc đoạn liên quan (Ví dụ: [1, trang 5]).
    3. Nếu nội dung không có trong Tài liệu, bạn CÓ THỂ sử dụng thông tin từ TÌM KIẾM TRÊN WEB (nếu có) để trả lời, nhưng PHẢI trích dẫn rõ nguồn web (Ví dụ: [Web: Tên trang]).
    4. Nếu không có thông tin từ cả 2 nguồn, hãy nói rằng "Tôi không tìm thấy thông tin".
    5. Trình bày bằng Tiếng Việt rõ ràng.
    `;

    return await model.stream(prompt);
  },

  prepareAsk: async (question, docIds, userId, sessionId = null) => {
    // Permission check
    for (const docId of docIds) {
      const doc = await Document.findById(docId);
      if (!doc) throw new Error("Tài liệu không tồn tại");

      let hasAccess = false;
      if (doc.userId.toString() === userId.toString()) {
        hasAccess = true;
      } else {
        const shareConfig = doc.sharedWith && doc.sharedWith.find(s =>
          s.user.toString() === userId.toString()
        );
        if (shareConfig) {
          if (shareConfig.expiresAt && new Date() > new Date(shareConfig.expiresAt)) {
            throw new Error(`Quyền chia sẻ tài liệu "${doc.fileName}" đã hết hạn`);
          }
          hasAccess = true;
        }

        // Kiểm tra quyền từ Workspace
        if (!hasAccess && doc.workspaceId) {
          const workspace = await Workspace.findOne({
            _id: doc.workspaceId,
            $or: [{ ownerId: userId }, { "members.user": userId }]
          });
          if (workspace) hasAccess = true;
        }
      }

      if (!hasAccess) {
        throw new Error("Bạn không có quyền chat với tài liệu này");
      }
    }

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

  saveChatMessages: async (question, answer, chunks, userId, sessionId, latencyMs = 0) => {
    const promptTokens = Math.ceil(question.length / 4);
    const completionTokens = Math.ceil(answer.length / 4);
    const totalTokens = promptTokens + completionTokens;

    const savedMsg = await Message.create({
      sessionId,
      role: "assistant",
      content: answer,
      prompt: question,
      answer: answer,
      model: "gemini-flash-latest",
      temperature: 0.3,
      promptTokens,
      completionTokens,
      totalTokens,
      latency: latencyMs,
      metadata: {
        sources: chunks.map((c, idx) => ({
          docId: c.metadata?.source || c.metadata?.docId || c.source,
          chunkId: c.metadata?._id?.toString() || c.metadata?.chunkIndex?.toString() || "",
          fileName: c.metadata?.fileName || c.fileName,
          pageNumber: c.metadata?.pageNumber || c.pageNumber || 1,
          pageContent: c.pageContent ? c.pageContent.substring(0, 200) + "..." : "",
          similarityScore: c.similarityScore || 0,
        })),
      },
    });

    // Cập nhật session: lastMessageAt và tăng messageCount
    await ChatSession.findByIdAndUpdate(sessionId, {
      lastMessageAt: new Date(),
      $inc: { messageCount: 2 },
    });

    // Log usage
    await logUsage({
      userId,
      type: "chat",
      tokens: totalTokens,
      processingTime: latencyMs,
      metadata: { sessionId, model: "gemini-flash-latest" }
    });

    return savedMsg;
  },

  performWebSearch: async (query) => {
    if (!process.env.TAVILY_API_KEY) {
      logger.warn("TAVILY_API_KEY chưa được thiết lập. Bỏ qua tìm kiếm web.");
      return null;
    }
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: "basic",
          include_answer: true,
          max_results: 3
        })
      });
      if (!response.ok) {
        throw new Error(`Tavily API responded with ${response.status}`);
      }
      const data = await response.json();
      return data.results.map(r => `[Web: ${r.title}](${r.url}): ${r.content}`).join("\n\n");
    } catch (error) {
      logger.error("[ChatService] Lỗi khi tìm kiếm trên web:", error);
      return null;
    }
  },

  askDocument: async (question, docIds, userId, sessionId = null) => {
    const askStart = Date.now();
    const { sessionId: currentSessionId, chunks } = await chatService.prepareAsk(question, docIds, userId, sessionId);

    let history = await Message.find({ sessionId: currentSessionId })
      .sort({ createdAt: -1 })
      .skip(1) // Bỏ qua câu hỏi vừa lưu
      .limit(6);
    history.reverse();

    const webContext = await chatService.performWebSearch(question);

    const apiResponse = await chatService.generateAnswer(question, chunks, history, webContext);
    const latencyMs = Date.now() - askStart;

    const savedMsg = await chatService.saveChatMessages(question, apiResponse, chunks, userId, currentSessionId, latencyMs);

    return {
      sessionId: currentSessionId,
      message: apiResponse,
      promptTokens: savedMsg.promptTokens,
      completionTokens: savedMsg.completionTokens,
      totalTokens: savedMsg.totalTokens,
      latency: latencyMs,
      model: "gemini-flash-latest",
      sources: chunks.map((c, i) => ({
        index: i + 1,
        docId: c.metadata?.source || c.metadata?.docId || c.source,
        chunkId: c.metadata?._id?.toString() || c.metadata?.chunkIndex?.toString() || "",
        fileName: c.metadata?.fileName || c.fileName,
        pageNumber: c.metadata?.pageNumber || c.pageNumber || 1,
        similarityScore: c.similarityScore || 0,
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
    const sessions = await ChatSession.find({ userId })
      .populate("docIds", "fileName")
      .sort({
        isPinned: -1,
        updatedAt: -1,
      });

    // Trả về mảng rỗng nếu không có lịch sử thay vì ném lỗi
    return sessions || [];
  },
};

export default chatService;
