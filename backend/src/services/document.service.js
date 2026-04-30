import mongoose from "mongoose";
import Document from "../models/document.model.js";
import logger from "../utils/logger.js";
import ocrService from "./ocr.service.js";
import aiService from "./ai.service.js";
import { logUsage } from "../config/usage.js";
import { Document as LangChainDocument } from "@langchain/core/documents";


const documentService = {
  uploadDocument: async (userId, file) => {
    return await Document.create({
      userId,
      fileName: file.originalname || file.fileName,
      fileType: file.mimetype || file.fileType,
      fileSize: file.size || file.fileSize,
      fileUrl: file.path || file.fileUrl,
      cloudFileId: file.filename || file.cloudFileId,
      status: "pending",
    });
  },

  processEmbeddings: async (docId) => {
    try {
      const doc = await Document.findByIdAndUpdate(
        docId,
        {
          status: "processing",
          progress: 10,
        },
        { returnDocument: "after" },
      );

      if (!doc) throw new Error("Không tìm thấy tài liệu");

      const response = await fetch(doc.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      let docs = [];
      const fileType = doc.fileType;
      const fileName = doc.fileName.toLowerCase();

      // --- PHẦN 1: TRÍCH XUẤT VĂN BẢN (LOADER + OCR) ---
      if (fileType.startsWith("image/")) {
        // Xử lý File Ảnh bằng OCR
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

      // Chuẩn hóa metadata cho tất cả các trang
      docs = docs.map((d) => {
        return new LangChainDocument({
          pageContent: d.pageContent,
          metadata: {
            source: new mongoose.Types.ObjectId(docId),
            userId: new mongoose.Types.ObjectId(doc.userId),
            fileName: doc.fileName,
            pageNumber: d.metadata?.loc?.pageNumber || d.metadata?.pageNumber || 1,
          },
        });
      });

      const fullText = docs.map((d) => d.pageContent).join("\n").trim();
      if (!fullText || fullText.length < 5) {
        throw new Error(
          "Không thể trích xuất văn bản (File trống hoặc không hỗ trợ)",
        );
      }

      await Document.findByIdAndUpdate(docId, { progress: 40 });

      // --- PHẦN 2: CHIA NHỎ VĂN BẢN (TEXT SPLITTING) ---
      const { RecursiveCharacterTextSplitter } = await import(
        "@langchain/textsplitters"
      );
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      // splitDocuments giúp duy trì metadata (pageNumber) cho từng chunk
      const chunkDocs = await splitter.splitDocuments(docs);
      logger.info(`Đã chia tài liệu thành ${chunkDocs.length} đoạn (chunks)`);

      // --- PHẦN 3: TẠO EMBEDDINGS & LƯU VECTOR DB ---
      const { GoogleGenerativeAIEmbeddings } = await import(
        "@langchain/google-genai"
      );
      const { MongoDBAtlasVectorSearch } = await import("@langchain/mongodb");
      
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-embedding-001",
      });

      const collection = mongoose.connection.db.collection("documents");

      await MongoDBAtlasVectorSearch.fromDocuments(chunkDocs, embeddings, {
        collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
      });

      // --- PHẦN 4: TÓM TẮT & GỢI Ý CÂU HỎI (AI SERVICE) ---
      aiService
        .generateMetadata(fullText)
        .then(async (result) => {
          await Document.findByIdAndUpdate(docId, {
            summary: result.summary,
            suggestedQuestions: result.questions,
          });
          logger.info(`Đã cập nhật tóm tắt cho tài liệu: ${docId}`);
        })
        .catch((err) => logger.error(`Lỗi tóm tắt tài liệu ${docId}:`, err));

      await Document.findByIdAndUpdate(docId, {
        status: "completed",
        progress: 100,
        vectorNamespace: `doc_${docId}`,
        totalChunks: chunkDocs.length,
      });

      // Log usage for embedding
      await logUsage({
        userId: doc.userId,
        type: "embedding",
        tokens: Math.ceil(fullText.length / 4), // Ước tính
        processingTime: Date.now() - startTime,
        metadata: { docId }
      });

      logger.info(`Đã xử lý xong Vector cho: ${docId}`);
      return await Document.findById(docId);
    } catch (error) {
      const failedDoc = await Document.findByIdAndUpdate(docId, {
        status: "failed",
        errorMessage: error.message,
      }, { returnDocument: "after" });
      logger.error(`Lỗi xử lý tài liệu ${docId}:`, error);
      return failedDoc;
    }
  },


  getDocumentByUser: async (userId, page = 1, limit = 10, search = "") => {
    const query = { userId };
    if (search) {
      query.fileName = { $regex: search, $options: "i" };
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
    const document = await Document.findOne({ _id: docId, userId });
    if (!document) {
      throw new Error("Tài liệu không tồn tại hoặc bạn không có quyền xem");
    }
    return document;
  },

  deleteDocumentById: async (docId, userId) => {
    const document = await Document.findOneAndDelete({ _id: docId, userId });
    if (!document) throw new Error("Xóa Database không thành công");

    const collection = mongoose.connection.db.collection('documents');
    const deleteResult = await collection.deleteMany({
      'metadata.source': new mongoose.Types.ObjectId(docId)
    });

    logger.info(`Đã xóa ${deleteResult.deletedCount} vector của tài liệu ${docId}`);
    return document;
  },


};

export default documentService;
