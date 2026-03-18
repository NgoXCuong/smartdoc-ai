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
      clouFileId: file.filename || file.clouFileId,
      status: "pending",
    });
  },

  processEmbeddings: async (docId) => {
    try {
      await Document.findByIdAndUpdate(docId, {
        status: "processing",
        progress: 10,
      });

      // Giả lập quá trình xử lý tài liệu và tạo embeddings
      await Document.findByIdAndUpdate(docId, {
        status: "completed",
        progress: 100,
        vectorNamespace: `doc_${docId}`,
      });
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
      Document.countDocuments(query)
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
    return document;
  },
};

export default documentService;
