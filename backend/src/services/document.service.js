import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Document as LangChainDocument } from "@langchain/core/documents";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";

import Document from "../models/document.model.js";
import logger from "../utils/logger.js";

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
        { returnDocument: 'after' },
      );

      if (!doc) throw new Error("Không tìm thấy tài liệu");

      const response = await fetch(doc.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());


      // Chọn loader phù hợp dựa trên loại file
      let docs = [];
      const fileType = doc.fileType;
      const fileName = doc.fileName.toLowerCase();

      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        const blob = new Blob([buffer]);
        const loader = new WebPDFLoader(blob);
        docs = await loader.load();
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
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
        docs = [new LangChainDocument({ pageContent: content, metadata: { source: docId } })];
      } else {
        throw new Error(`Định dạng file ${fileType || fileName} chưa được hỗ trợ`);
      }

      const text = docs.map((d) => d.pageContent).join("\n").trim();

      if (!text || text.length < 5) {
        throw new Error("Không thể trích xuất văn bản từ tài liệu này (Tài liệu trống hoặc không hỗ trợ)");
      }

      logger.info(`Đã trích xuất ${text.length} ký tự từ tài liệu: ${docId}`);

      // Giả lập quá trình xử lý tài liệu và tạo embeddings
      await Document.findByIdAndUpdate(docId, { progress: 40 });

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunkDocs = await splitter.createDocuments(
        [text],
        [{
          metadata: {
            source: new mongoose.Types.ObjectId(docId),
            userId: new mongoose.Types.ObjectId(doc.userId),
            fileName: doc.fileName,
          }
        }]
      );

      logger.info(`Đã chia tài liệu thành ${chunkDocs.length} đoạn (chunks)`);

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
        metadataKey: "metadata"
      });

      await Document.findByIdAndUpdate(docId, {
        status: "completed",
        progress: 100,
        vectorNamespace: `doc_${docId}`,
        totalChunks: chunkDocs.length,
      });

      logger.info(`Đã xử lý xong Vector cho tài liệu: ${docId} với ${chunkDocs.length} chunks`);
    } catch (error) {
      await Document.findByIdAndUpdate(docId, {
        status: "failed",
        errorMessage: error.message,
      });
      logger.error(`Lỗi khi cập nhật trạng thái tài liệu ${docId}:`, error);
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
