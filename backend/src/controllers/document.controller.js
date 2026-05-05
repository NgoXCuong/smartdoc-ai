import documentService from "../services/document.service.js";
import storageService from "../services/storage.service.js";
import { addDocumentJob } from "../queues/document.queue.js";
import logger from "../utils/logger.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadDocument = asyncHandler(async (req, res) => {
  const { file } = req;
  const { userId } = req.user;
  const { workspaceId } = req.body;

  if (!file) throw new ApiError(400, "Không có tệp nào được tải lên");

  // 1. Lưu file lên Supabase trước qua storage service
  const uploadedFile = await storageService.uploadDocument(file);

  if (!uploadedFile.fileUrl || !uploadedFile.cloudFileId) {
    throw new ApiError(500, "Lỗi khi tải tệp lên bộ nhớ đám mây");
  }

  // 2. Lưu Metadata vào MongoDB (Sau khi đã có link Cloud)
  const fileMetadata = {
    originalname: Buffer.from(file.originalname, "latin1").toString("utf8"),
    mimetype: file.mimetype,
    size: file.size || 0,
    fileUrl: uploadedFile.fileUrl,
    cloudFileId: uploadedFile.cloudFileId,
  };

  if (workspaceId) {
    fileMetadata.workspaceId = workspaceId;
  }

  logger.info(`[Upload] Creating document record for user: ${userId}, file: ${fileMetadata.originalname}`);

  const newDocument = await documentService.uploadDocument(
    userId,
    fileMetadata,
  );

  try {
    // 3. Tiến hành trích xuất chữ (Vector process) bất đồng bộ qua Queue
    await addDocumentJob(newDocument._id);
  } catch (queueError) {
    // Nếu đẩy vào queue lỗi, xóa luôn bản ghi vừa tạo để tránh rác DB
    await documentService.deleteDocumentById(newDocument._id, userId);
    throw new ApiError(500, `Lỗi hàng đợi: ${queueError.message}. Vui lòng kiểm tra Redis.`);
  }

  return res.status(201).json({
    success: true,
    message: "Tải lên thành công, tài liệu đang được xử lý",
    document: newDocument,
  });
});

export const getDocuments = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page, limit, search, folderId, workspaceId } = req.query;

  const result = await documentService.getDocumentByUser(
    userId,
    page,
    limit,
    search,
    folderId,
    workspaceId
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getDocumentInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const document = await documentService.getDocumentById(id, userId);
  return res.status(200).json({ 
    success: true,
    document 
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const document = await documentService.getDocumentById(id, userId);

  if (document.cloudFileId) {
    await storageService.deleteDocument(document.cloudFileId);
  }

  // 3. Xóa các vector liên quan trong VectorDB
  // (Đã được xử lý bên trong documentService.deleteDocumentById)

  await documentService.deleteDocumentById(id, userId);
  return res.status(200).json({ 
    success: true,
    message: "Đã xóa tài liệu và file Cloud thành công" 
  });
});

export const shareDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, permission } = req.body;

  if (!email) throw new ApiError(400, "Vui lòng cung cấp email");

  const document = await documentService.shareDocument(id, req.user.userId, email, permission || "view");
  return res.status(200).json({ 
    success: true,
    message: "Chia sẻ tài liệu thành công", 
    document 
  });
});

export const removeDocumentShare = asyncHandler(async (req, res) => {
  const { id, email } = req.params;
  const document = await documentService.removeDocumentShare(id, req.user.userId, email);
  return res.status(200).json({ 
    success: true,
    message: "Đã hủy chia sẻ", 
    document 
  });
});

export const extractDocumentData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keys } = req.body;
  const userId = req.user.userId;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    throw new ApiError(400, "Vui lòng cung cấp mảng các trường cần trích xuất (keys)");
  }

  // Lấy nội dung text của document
  const text = await documentService.getDocumentText(id, userId);

  // Gọi AI trích xuất
  const aiServiceModule = await import("../services/ai.service.js");
  const aiService = aiServiceModule.default;
  
  const extractedData = await aiService.extractStructuredData(text, keys);

  return res.status(200).json({
    success: true,
    message: "Trích xuất dữ liệu thành công",
    data: extractedData
  });
});

