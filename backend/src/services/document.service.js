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
};

export default documentService;
