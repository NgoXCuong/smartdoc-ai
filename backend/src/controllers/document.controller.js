import documentService from "../services/document.service.js";

export const uploadDocument = async (req, res) => {
  try {
    const { file } = req;
    const { _id: userId } = req.user;

    if (!file) throw new Error("Không có tệp nào được tải lên");

    const newDocument = await documentService.uploadDocument(userId, file);

    documentService.uploadDocument(newDucument._id).catch((err) => {
      console.error("Lỗi khi lưu tài liệu vào cơ sở dữ liệu:", err);
    });

    return res.status(201).json({
      message: "Tài liệu đang được xử lý",
      document: newDocument,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
