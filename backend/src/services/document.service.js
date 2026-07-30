import mongoose from "mongoose";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";
import Workspace from "../models/workspace.model.js";
import logger from "../utils/logger.js";
import ocrService from "./ocr.service.js";
import aiService from "./ai.service.js";
import { logUsage } from "../config/usage.js";
import { Document as LangChainDocument } from "@langchain/core/documents";
import { emitToUser } from "../config/socket.js";
import notificationService from "./notification.service.js";
import activityLogService from "./activityLog.service.js";


const documentService = {
  uploadDocument: async (userId, file) => {
    return await Document.create({
      userId,
      fileName: file.originalname || file.fileName,
      fileType: file.mimetype || file.fileType,
      fileSize: file.size || file.fileSize,
      fileUrl: file.path || file.fileUrl,
      cloudFileId: file.filename || file.cloudFileId,
      workspaceId: file.workspaceId || null,
      folderId: file.folderId || null,
      status: "pending",
    });
  },

  processEmbeddings: async (docId) => {
    const startTime = Date.now();
    const processingStartedAt = new Date();
    let isOcrUsed = false;
    
    // Import ProcessingJob model
    const ProcessingJob = (await import("../models/processingJob.model.js")).default;
    
    // Tạo hoặc cập nhật ProcessingJob record
    let job = await ProcessingJob.findOneAndUpdate(
      { docId },
      {
        docId,
        status: "processing",
        currentStep: "extract",
        steps: {
          extract: { status: "processing", durationMs: 0 },
          chunk: { status: "pending", totalChunks: 0 },
          embedding: { status: "pending", progress: 0 },
          summary: { status: "pending" },
        },
        error: null,
      },
      { upsert: true, returnDocument: "after" }
    );

    try {
      const doc = await Document.findByIdAndUpdate(
        docId,
        {
          status: "processing",
          progress: 10,
          processingStartedAt,
        },
        { returnDocument: "after" },
      );
      
      if (!doc) throw new Error("Không tìm thấy tài liệu");

      // Bắn Socket sự kiện chi tiết công việc
      emitToUser(doc.userId, "document_progress", { docId, progress: 10, status: "processing" });
      emitToUser(doc.userId, "document_job_update", { docId, job });

      const response = await fetch(doc.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      let docs = [];
      const fileType = doc.fileType;
      const fileName = doc.fileName.toLowerCase();

      // --- PHẦN 1: TRÍCH XUẤT VĂN BẢN (LOADER + OCR) ---
      if (fileType.startsWith("image/")) {
        // Xử lý File Ảnh bằng OCR
        isOcrUsed = true;
        const text = await ocrService.extractText(buffer);
        docs = [
          new LangChainDocument({
            pageContent: text,
            metadata: { pageNumber: 1 },
          }),
        ];
      } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        // Xử lý File PDF
        const { WebPDFLoader } = await import(
          "@langchain/community/document_loaders/web/pdf"
        );
        const blob = new Blob([buffer]);
        const loader = new WebPDFLoader(blob);
        docs = await loader.load();

        // Kiểm tra nếu PDF Scanned (Không có chữ)
        const totalText = docs.map((d) => d.pageContent).join("").trim();
        if (totalText.length < 10) {
          logger.info("PDF có vẻ là dạng ảnh quét. Đang tiến hành OCR đa trang...");
          isOcrUsed = true;
          const { fullText, pageResults } = await ocrService.handlePDFOCR(buffer);
          
          if (pageResults && pageResults.length > 0) {
            docs = pageResults.map(p => new LangChainDocument({
              pageContent: p.content,
              metadata: { pageNumber: p.pageNumber }
            }));
          } else {
            throw new Error("Không thể trích xuất văn bản từ PDF quét");
          }
        }
      } else if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        const { DocxLoader } = await import(
          "@langchain/community/document_loaders/fs/docx"
        );
        const blob = new Blob([buffer]);
        const loader = new DocxLoader(blob);
        docs = await loader.load();
      } else if (
        fileType === "text/plain" ||
        fileType === "text/markdown" ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md")
      ) {
        const content = buffer.toString("utf-8");
        docs = [
          new LangChainDocument({
            pageContent: content,
            metadata: { pageNumber: 1 },
          }),
        ];
      } else {
        throw new Error(
          `Định dạng file ${fileType || fileName} chưa được hỗ trợ`,
        );
      }

      // Helper phân loại ngữ nghĩa trang (Mục lục TOC vs Nội dung CONTENT)
      const detectTocSection = (text, pageNumber = 1) => {
        if (!text) return { isTOC: false, sectionType: "CONTENT" };
        const lower = text.toLowerCase();
        const hasTocHeader = lower.includes("mục lục") || lower.includes("table of contents") || lower.includes("danh mục hình") || lower.includes("danh mục bảng");
        const dotPatternCount = (text.match(/\.{3,}/g) || []).length;
        const lineDotCount = (text.match(/\.\s*\.\s*\.\s*\./g) || []).length;

        if (hasTocHeader || dotPatternCount >= 2 || lineDotCount >= 2) {
          return { isTOC: true, sectionType: "TOC" };
        }

        if (pageNumber <= 5) {
          const lines = text.split("\n").filter(l => l.trim().length > 0);
          const linesEndingWithPageNum = lines.filter(l => /\s+\d+\s*$/.test(l)).length;
          if (lines.length > 5 && (linesEndingWithPageNum / lines.length) > 0.35) {
            return { isTOC: true, sectionType: "TOC" };
          }
        }
        return { isTOC: false, sectionType: "CONTENT" };
      };

      // Chuẩn hóa metadata và gán nhãn phân loại ngữ nghĩa cho tất cả các trang
      docs = docs.map((d) => {
        const pageNum = d.metadata?.loc?.pageNumber || d.metadata?.pageNumber || 1;
        const tocInfo = detectTocSection(d.pageContent, pageNum);

        return new LangChainDocument({
          pageContent: d.pageContent,
          metadata: {
            source: new mongoose.Types.ObjectId(docId),
            userId: new mongoose.Types.ObjectId(doc.userId),
            fileName: doc.fileName,
            pageNumber: pageNum,
            isTOC: tocInfo.isTOC,
            sectionType: tocInfo.sectionType,
          },
        });
      });

      const fullText = docs.map((d) => d.pageContent).join("\n").trim();
      if (!fullText || fullText.length < 5) {
        throw new Error(
          "Không thể trích xuất văn bản (File trống hoặc không hỗ trợ)",
        );
      }

      const extractDuration = Date.now() - startTime;
      await Document.findByIdAndUpdate(docId, { progress: 35, pageCount: docs.length, ocrEnabled: isOcrUsed });

      // Cập nhật Job sang bước 2: Chunking
      job = await ProcessingJob.findOneAndUpdate(
        { docId },
        {
          currentStep: "chunk",
          "steps.extract": {
            status: "completed",
            durationMs: extractDuration,
            pageCount: docs.length,
            ocrEnabled: isOcrUsed,
          },
          "steps.chunk": { status: "processing", totalChunks: 0 },
        },
        { returnDocument: "after" }
      );
      emitToUser(doc.userId, "document_progress", { docId, progress: 35, status: "processing" });
      emitToUser(doc.userId, "document_job_update", { docId, job });

      // --- PHẦN 2: CHIA NHỎ VĂN BẢN (TEXT SPLITTING) ---
      const { RecursiveCharacterTextSplitter } = await import(
        "@langchain/textsplitters"
      );
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2500, // Tăng kích thước chunk để giữ nhiều ngữ cảnh hơn
        chunkOverlap: 500, // Tăng vùng chồng lấn
        separators: ["\n\n\n", "\n\n", "\n", "•", " ", ""], // Ưu tiên cắt ở các đoạn văn, danh sách
      });

      const splitDocs = await splitter.splitDocuments(docs);
      
      const chunkDocs = splitDocs.map((chunk, idx) => {
        const tocInfo = detectTocSection(chunk.pageContent, chunk.metadata?.pageNumber || 1);
        return new LangChainDocument({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            chunkIndex: idx,
            docId: new mongoose.Types.ObjectId(docId),
            isTOC: chunk.metadata?.isTOC !== undefined ? chunk.metadata.isTOC : tocInfo.isTOC,
            sectionType: chunk.metadata?.sectionType || tocInfo.sectionType,
          },
        });
      });

      logger.info(`Đã chia tài liệu thành ${chunkDocs.length} đoạn (chunks)`);

      await Document.findByIdAndUpdate(docId, { progress: 60, totalChunks: chunkDocs.length });

      // Cập nhật Job sang bước 3: Embedding
      job = await ProcessingJob.findOneAndUpdate(
        { docId },
        {
          currentStep: "embedding",
          "steps.chunk": {
            status: "completed",
            totalChunks: chunkDocs.length,
          },
          "steps.embedding": { status: "processing", progress: 50 },
        },
        { returnDocument: "after" }
      );
      emitToUser(doc.userId, "document_progress", { docId, progress: 60, status: "processing" });
      emitToUser(doc.userId, "document_job_update", { docId, job });

      // --- PHẦN 3: TẠO EMBEDDINGS & LƯU VECTOR DB ---
      const { GoogleGenerativeAIEmbeddings } = await import(
        "@langchain/google-genai"
      );
      const { MongoDBAtlasVectorSearch } = await import("@langchain/mongodb");
      
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-embedding-001",
      });

      const collection = mongoose.connection.db.collection("document_chunks");

      await MongoDBAtlasVectorSearch.fromDocuments(chunkDocs, embeddings, {
        collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
      });

      await Document.findByIdAndUpdate(docId, { progress: 85 });

      // Cập nhật Job sang bước 4: Summary
      job = await ProcessingJob.findOneAndUpdate(
        { docId },
        {
          currentStep: "summary",
          "steps.embedding": { status: "completed", progress: 100 },
          "steps.summary": { status: "processing" },
        },
        { returnDocument: "after" }
      );
      emitToUser(doc.userId, "document_progress", { docId, progress: 85, status: "processing" });
      emitToUser(doc.userId, "document_job_update", { docId, job });

      // --- PHẦN 4: TÓM TẮT & GỢI Ý CÂU HỎI (AI SERVICE) ---
      try {
        const result = await aiService.generateMetadata(fullText);
        await Document.findByIdAndUpdate(docId, {
          summary: result.summary,
          tags: result.tags || [],
          suggestedQuestions: result.questions || [],
        });
        logger.info(`Đã cập nhật tóm tắt cho tài liệu: ${docId}`);
      } catch (err) {
        logger.error(`Lỗi tóm tắt tài liệu ${docId}:`, err);
      }

      const processingFinishedAt = new Date();
      await Document.findByIdAndUpdate(docId, {
        status: "completed",
        progress: 100,
        vectorNamespace: `doc_${docId}`,
        totalChunks: chunkDocs.length,
        processingFinishedAt,
        lastIndexedAt: processingFinishedAt,
      });

      // Hoàn thành toàn bộ Job
      job = await ProcessingJob.findOneAndUpdate(
        { docId },
        {
          status: "completed",
          currentStep: "completed",
          "steps.summary": { status: "completed" },
        },
        { returnDocument: "after" }
      );

      emitToUser(doc.userId, "document_progress", { docId, progress: 100, status: "completed" });
      emitToUser(doc.userId, "document_job_update", { docId, job });

      // Gửi Notification cho người dùng khi xử lý xong
      await notificationService.createNotification({
        recipientId: doc.userId,
        type: "PROCESS_COMPLETED",
        title: "Xử lý tài liệu hoàn tất",
        message: `Tài liệu "${doc.fileName}" đã hoàn tất trích xuất dữ liệu & tạo Vector sẵn sàng để hội thoại.`,
        link: `/chat?docId=${doc._id}`,
        metadata: { docId: doc._id },
      });

      // Log activity
      await activityLogService.logActivity({
        userId: doc.userId,
        workspaceId: doc.workspaceId,
        action: "UPLOAD_FILE",
        targetId: doc._id,
        targetType: "document",
        details: { fileName: doc.fileName, fileSize: doc.fileSize },
      });

      // Log usage for embedding
      await logUsage({
        userId: doc.userId,
        type: "embedding",
        tokens: Math.ceil(fullText.length / 4),
        processingTime: Date.now() - startTime,
        metadata: { docId }
      });

      logger.info(`Đã xử lý xong Vector cho: ${docId}`);
      return await Document.findById(docId);
    } catch (error) {
      const failedDoc = await Document.findByIdAndUpdate(docId, {
        status: "failed",
        errorMessage: error.message,
        processingFinishedAt: new Date(),
      }, { returnDocument: "after" });

      if (failedDoc) {
        job = await ProcessingJob.findOneAndUpdate(
          { docId },
          {
            status: "failed",
            error: error.message,
          },
          { returnDocument: "after" }
        );

        emitToUser(failedDoc.userId, "document_job_update", { docId, job });

        await notificationService.createNotification({
          recipientId: failedDoc.userId,
          type: "PROCESS_COMPLETED",
          title: "Xử lý tài liệu thất bại",
          message: `Rất tiếc, tài liệu "${failedDoc.fileName}" gặp lỗi khi xử lý: ${error.message}`,
          link: "/",
          metadata: { docId: failedDoc._id, error: error.message },
        });
      }

      logger.error(`Lỗi xử lý tài liệu ${docId}:`, error);
      return failedDoc;
    }
  },


  getDocumentByUser: async (userId, page = 1, limit = 10, search = "", folderId = null, workspaceId = null) => {
    // Tự động chuyển các tài liệu bị kẹt trạng thái pending/processing quá 2 phút thành failed
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await Document.updateMany(
      {
        userId,
        status: { $in: ["pending", "processing"] },
        createdAt: { $lt: twoMinutesAgo }
      },
      {
        $set: {
          status: "failed",
          errorMessage: "Thời gian xử lý quá lâu hoặc gặp lỗi hệ thống",
          processingFinishedAt: new Date()
        }
      }
    );

    // Nếu truyền workspaceId cụ thể
    if (workspaceId) {
      // Xác minh quyền
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }],
      });
      if (!workspace) throw new Error("Không có quyền truy cập không gian làm việc này");
      
      const query = { workspaceId };
      if (search) {
        query.fileName = { $regex: search, $options: "i" };
      }
      if (folderId && folderId !== 'null') {
        query.folderId = folderId;
      } else if (folderId === 'null') {
        query.folderId = null;
      }

      const skip = (page - 1) * limit;
      const [documents, total] = await Promise.all([
        Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Document.countDocuments(query),
      ]);

      return { documents, totalPages: Math.ceil(total / limit), currentPage: Number(page), totalDocuments: total };
    }


    const query = {
      $or: [{ userId }, { "sharedWith.user": userId }],
      workspaceId: null // RẤT QUAN TRỌNG: Lọc riêng tài liệu cá nhân
    };
    if (search) {
      query.fileName = { $regex: search, $options: "i" };
    }
    
    if (folderId && folderId !== 'null') {
      query.folderId = folderId;
    } else if (folderId === 'null') {
      query.folderId = null;
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(query),
    ]);

    return {
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalDocuments: total,
    };
  },

  getDocumentById: async (docId, userId) => {
    const document = await Document.findById(docId).populate("sharedWith.user", "name email avatar");
    if (!document) throw new Error("Tài liệu không tồn tại");

    let hasAccess = false;
    let shareConfig = null;

    if (document.userId.toString() === userId.toString()) {
      hasAccess = true;
    } else {
      shareConfig = document.sharedWith.find(s => s.user?._id?.toString() === userId.toString() || s.user?.toString() === userId.toString());
      if (shareConfig) {
        // Kiểm tra hết hạn chia sẻ
        if (shareConfig.expiresAt && new Date() > new Date(shareConfig.expiresAt)) {
          throw new Error("Quyền chia sẻ tài liệu này đã hết hạn");
        }
        hasAccess = true;
      }
    }
    
    // Nếu tài liệu thuộc Workspace, kiểm tra người dùng có phải thành viên không
    if (!hasAccess && document.workspaceId) {
      const workspace = await Workspace.findOne({
        _id: document.workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }]
      });
      if (workspace) hasAccess = true;
    }

    if (!hasAccess) {
      throw new Error("Bạn không có quyền xem tài liệu này");
    }
    return document;
  },

  deleteDocumentById: async (docId, userId) => {
    const document = await Document.findOneAndDelete({ _id: docId, userId });
    if (!document) throw new Error("Xóa Database không thành công");

    // Log Activity
    await activityLogService.logActivity({
      userId,
      workspaceId: document.workspaceId,
      action: "DELETE_FILE",
      targetId: document._id,
      targetType: "document",
      details: { fileName: document.fileName },
    });

    const collection = mongoose.connection.db.collection('document_chunks');
    const deleteResult = await collection.deleteMany({
      $or: [
        { source: new mongoose.Types.ObjectId(docId) },
        { docId: new mongoose.Types.ObjectId(docId) }
      ]
    });

    logger.info(`Đã xóa ${deleteResult.deletedCount} vector của tài liệu ${docId}`);
    return document;
  },

  shareDocument: async (docId, ownerId, targetEmail, permission = "view", expiresAt = null, canDownload = true) => {
    const document = await Document.findOne({ _id: docId, userId: ownerId }).populate("userId", "name email");
    if (!document) throw new Error("Tài liệu không tồn tại hoặc bạn không có quyền");
    
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng với email này không tồn tại");
    if (targetUser._id.toString() === ownerId.toString()) throw new Error("Không thể chia sẻ cho chính mình");

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const existingShareIndex = document.sharedWith.findIndex(s => s.user.toString() === targetUser._id.toString());
    if (existingShareIndex !== -1) {
      document.sharedWith[existingShareIndex].permission = permission;
      document.sharedWith[existingShareIndex].sharedBy = ownerId;
      document.sharedWith[existingShareIndex].expiresAt = parsedExpiresAt;
      document.sharedWith[existingShareIndex].canDownload = canDownload !== undefined ? canDownload : true;
    } else {
      document.sharedWith.push({ 
        user: targetUser._id, 
        permission, 
        sharedBy: ownerId,
        expiresAt: parsedExpiresAt,
        canDownload: canDownload !== undefined ? canDownload : true
      });
    }
    
    await document.save();

    // Gửi thông báo cho người nhận
    await notificationService.createNotification({
      recipientId: targetUser._id,
      senderId: ownerId,
      type: "DOC_SHARED",
      title: "Bạn nhận được tài liệu mới",
      message: `${document.userId?.name || 'Một người dùng'} đã chia sẻ tài liệu "${document.fileName}" với quyền ${permission === 'chat' ? 'Hội thoại RAG' : 'Xem'}.`,
      link: `/chat?docId=${document._id}`,
      metadata: { docId: document._id, permission, expiresAt: parsedExpiresAt, canDownload },
    });

    // Log Activity
    await activityLogService.logActivity({
      userId: ownerId,
      workspaceId: document.workspaceId,
      action: "SHARE_DOC",
      targetId: document._id,
      targetType: "document",
      details: { fileName: document.fileName, targetEmail, permission, expiresAt: parsedExpiresAt, canDownload },
    });

    return await Document.findById(docId).populate("sharedWith.user", "name email avatar");
  },

  removeDocumentShare: async (docId, ownerId, targetEmail) => {
    const document = await Document.findOne({ _id: docId, userId: ownerId });
    if (!document) throw new Error("Tài liệu không tồn tại hoặc bạn không có quyền");
    
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng không tồn tại");

    document.sharedWith = document.sharedWith.filter(s => s.user.toString() !== targetUser._id.toString());
    return await document.save();
  },

  getDocumentText: async (docId, userId) => {
    // Xác thực quyền truy cập
    const document = await Document.findById(docId);
    if (!document) throw new Error("Tài liệu không tồn tại");

    let hasAccess = false;
    if (document.userId.toString() === userId.toString()) hasAccess = true;
    else if (document.sharedWith.some(s => s.user.toString() === userId.toString())) hasAccess = true;
    
    // Nếu tài liệu thuộc Workspace, kiểm tra người dùng có phải thành viên không
    if (!hasAccess && document.workspaceId) {
      const workspace = await Workspace.findOne({
        _id: document.workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }]
      });
      if (workspace) hasAccess = true;
    }

    if (!hasAccess) {
      throw new Error("Bạn không có quyền truy cập văn bản của tài liệu này");
    }

    // Lấy nội dung từ Vector DB
    const collection = mongoose.connection.db.collection('document_chunks');
    const chunks = await collection.find({
      $or: [
        { source: new mongoose.Types.ObjectId(docId) },
        { docId: new mongoose.Types.ObjectId(docId) }
      ]
    }).toArray();
    
    if (!chunks || chunks.length === 0) {
      throw new Error("Không tìm thấy nội dung văn bản cho tài liệu này");
    }

    // Sắp xếp theo trang nếu có metadata
    chunks.sort((a, b) => (a.metadata?.pageNumber || 0) - (b.metadata?.pageNumber || 0));
    
    const fullText = chunks.map(c => c.text).join("\n");
    return fullText;
  },

  /**
   * Tải lên phiên bản mới cho tài liệu sẵn có
   */
  uploadNewVersion: async (docId, userId, file, changeLog = "") => {
    const doc = await Document.findById(docId);
    if (!doc) throw new Error("Tài liệu không tồn tại");

    let hasAccess = doc.userId.toString() === userId.toString();
    if (!hasAccess && doc.workspaceId) {
      const workspace = await Workspace.findOne({
        _id: doc.workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }]
      });
      if (workspace) hasAccess = true;
    }
    if (!hasAccess) throw new Error("Bạn không có quyền tải phiên bản mới cho tài liệu này");

    // Lưu lại thông tin phiên bản hiện tại vào lịch sử
    const historyEntry = {
      version: doc.version || 1,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      cloudFileId: doc.cloudFileId,
      summary: doc.summary || "",
      totalChunks: doc.totalChunks || 0,
      changeLog: changeLog || `Cập nhật lên phiên bản ${(doc.version || 1) + 1}`,
      createdAt: doc.updatedAt || new Date(),
      createdBy: userId,
    };

    if (!doc.versionHistory) doc.versionHistory = [];
    doc.versionHistory.push(historyEntry);

    // Tăng số phiên bản và cập nhật file mới
    doc.version = (doc.version || 1) + 1;
    doc.fileName = file.originalname || file.fileName;
    doc.fileType = file.mimetype || file.fileType;
    doc.fileSize = file.size || file.fileSize;
    doc.fileUrl = file.path || file.fileUrl;
    doc.cloudFileId = file.filename || file.cloudFileId;
    doc.status = "pending";
    doc.progress = 0;
    doc.summary = null;

    await doc.save();

    // Xóa các vector chunks cũ
    const collection = mongoose.connection.db.collection('document_chunks');
    await collection.deleteMany({
      $or: [
        { source: new mongoose.Types.ObjectId(docId) },
        { docId: new mongoose.Types.ObjectId(docId) }
      ]
    });

    // Chạy lại quy trình Embedding RAG bất đồng bộ cho file mới
    documentService.processEmbeddings(docId).catch(err => {
      logger.error(`Lỗi xử lý embeddings cho phiên bản mới của ${docId}:`, err);
    });

    // Log Activity
    await activityLogService.logActivity({
      userId,
      workspaceId: doc.workspaceId,
      action: "UPLOAD_FILE",
      targetId: doc._id,
      targetType: "document",
      details: { fileName: doc.fileName, version: doc.version, changeLog },
    });

    return doc;
  },

  /**
   * Lấy lịch sử phiên bản của tài liệu
   */
  getVersionHistory: async (docId, userId) => {
    const doc = await Document.findById(docId).populate("versionHistory.createdBy", "username email avatar");
    if (!doc) throw new Error("Tài liệu không tồn tại");

    let hasAccess = doc.userId.toString() === userId.toString();
    if (!hasAccess && doc.sharedWith.some(s => s.user.toString() === userId.toString())) hasAccess = true;
    if (!hasAccess && doc.workspaceId) {
      const workspace = await Workspace.findOne({
        _id: doc.workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }]
      });
      if (workspace) hasAccess = true;
    }
    if (!hasAccess) throw new Error("Bạn không có quyền xem lịch sử phiên bản tài liệu này");

    return {
      currentVersion: doc.version || 1,
      currentDocument: {
        _id: doc._id,
        version: doc.version || 1,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        summary: doc.summary,
        updatedAt: doc.updatedAt,
      },
      versionHistory: doc.versionHistory || [],
    };
  },

  /**
   * Khôi phục (Rollback) lại một phiên bản cũ
   */
  restoreVersion: async (docId, userId, targetVersion) => {
    const doc = await Document.findById(docId);
    if (!doc) throw new Error("Tài liệu không tồn tại");

    let hasAccess = doc.userId.toString() === userId.toString();
    if (!hasAccess && doc.workspaceId) {
      const workspace = await Workspace.findOne({
        _id: doc.workspaceId,
        $or: [{ ownerId: userId }, { "members.user": userId }]
      });
      if (workspace) hasAccess = true;
    }
    if (!hasAccess) throw new Error("Bạn không có quyền khôi phục phiên bản cho tài liệu này");

    const versionItem = doc.versionHistory.find(v => v.version === Number(targetVersion));
    if (!versionItem) throw new Error(`Không tìm thấy phiên bản v${targetVersion} để khôi phục`);

    // Lưu phiên bản hiện tại trước khi khôi phục
    const historyEntry = {
      version: doc.version || 1,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      cloudFileId: doc.cloudFileId,
      summary: doc.summary || "",
      totalChunks: doc.totalChunks || 0,
      changeLog: `Khôi phục từ phiên bản v${targetVersion}`,
      createdAt: doc.updatedAt || new Date(),
      createdBy: userId,
    };
    doc.versionHistory.push(historyEntry);

    // Cập nhật lại thông tin file từ phiên bản cần khôi phục
    doc.version = (doc.version || 1) + 1;
    doc.fileName = versionItem.fileName;
    doc.fileType = versionItem.fileType;
    doc.fileSize = versionItem.fileSize;
    doc.fileUrl = versionItem.fileUrl;
    doc.cloudFileId = versionItem.cloudFileId;
    doc.status = "pending";
    doc.progress = 0;
    doc.summary = null;

    await doc.save();

    // Xóa vector chunks cũ
    const collection = mongoose.connection.db.collection('document_chunks');
    await collection.deleteMany({
      $or: [
        { source: new mongoose.Types.ObjectId(docId) },
        { docId: new mongoose.Types.ObjectId(docId) }
      ]
    });

    // Chạy lại RAG embedding
    documentService.processEmbeddings(docId).catch(err => {
      logger.error(`Lỗi xử lý embeddings khi khôi phục v${targetVersion} cho ${docId}:`, err);
    });

    return doc;
  }

};

export default documentService;
