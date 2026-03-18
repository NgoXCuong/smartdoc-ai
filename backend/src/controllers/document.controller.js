import documentService from "../services/document.service.js";
import storageService from "../services/storage.service.js";
// File xử lý upload và luồng chính

export const uploadDocument = async (req, res) => {
  try {
    const { file } = req;
    const { _id: userId } = req.user;

    if (!file) throw new Error("Không có tệp nào được tải lên");

    // 1. Lưu file lên Supabase trước qua storage service
    const uploadedFile = await storageService.uploadDocument(file);

    // 2. Lưu Metadata vào MongoDB (Sau khi đã có link Cloud)
    // Gộp data của req.file nguyên bản, và fileUrl/cloudFileId từ Supabase về
    const fileMetadata = {
      originalname: Buffer.from(file.originalname, "latin1").toString("utf8"), // Xử lý lỗi font tiếng Việt
      mimetype: file.mimetype,
      size: file.size,
      fileUrl: uploadedFile.fileUrl,
      clouFileId: uploadedFile.cloudFileId,
    };

    const newDocument = await documentService.uploadDocument(
      userId,
      fileMetadata,
    );

    // 3. Tiến hành trích xuất chữ (Vector process) bất đồng bộ, trả về response nhanh
    documentService.processEmbeddings(newDocument._id).catch((err) => {
      console.error("Lỗi khi xử lý Vector Embedding:", err);
    });

    return res.status(201).json({
      message: "Tài liệu đang được xử lý",
      document: newDocument,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    const { page, limit, search } = req.query;

    const result = await documentService.getDocumentByUser(
      userId,
      page,
      limit,
      search,
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getDocumentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const document = await documentService.getDocumentById(id, userId);
    return res.status(200).json({ document });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const document = await documentService.getDocumentById(id, userId);

    if (document.clouFileId) {
      await storageService.deleteDocument(document.clouFileId);
    }

    // 3. (Ghi chú) Chỗ này sau gọi lệnh xóa thẻ VectorDB
    // await vectorService.deleteVector(document.vectorNamespace);

    await documentService.deleteDocumentById(id, userId);
    return res
      .status(200)
      .json({ message: "Đã xóa tài liệu và file Cloud thành công" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
