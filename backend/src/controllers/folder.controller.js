import folderService from "../services/folder.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFolder = asyncHandler(async (req, res) => {
  const { name, color, parentFolderId, workspaceId } = req.body;
  const folder = await folderService.createFolder(
    req.user.userId,
    name,
    color,
    parentFolderId,
    workspaceId
  );
  res.status(201).json({ folder });
});

export const getFolders = asyncHandler(async (req, res) => {
  const { parentFolderId, workspaceId } = req.query;
  const folders = await folderService.getFolders(
    req.user.userId,
    parentFolderId,
    workspaceId
  );
  res.json({ folders });
});

export const getFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const folder = await folderService.getFolder(folderId, req.user.userId);
  if (!folder) return res.status(404).json({ message: "Không tìm thấy thư mục" });
  res.json({ folder });
});

export const getFolderBreadcrumbs = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const breadcrumbs = await folderService.getFolderBreadcrumbs(folderId, req.user.userId);
  res.json({ breadcrumbs });
});

export const updateFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const folder = await folderService.updateFolder(folderId, req.user.userId, req.body);
  res.json({ folder });
});

export const moveFolder = asyncHandler(async (req, res) => {
  const { folderId, targetParentFolderId } = req.body;
  const folder = await folderService.moveFolder(folderId, targetParentFolderId, req.user.userId);
  res.json({ message: "Đã di chuyển thư mục thành công", folder });
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const result = await folderService.deleteFolder(folderId, req.user.userId);
  res.json(result);
});

export const moveDocument = asyncHandler(async (req, res) => {
  const { docId, folderId } = req.body;
  const doc = await folderService.moveDocumentToFolder(docId, folderId, req.user.userId);
  res.json({ doc });
});

export const shareFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { email, permission } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng cung cấp email" });
  
  const folder = await folderService.shareFolder(folderId, req.user.userId, email, permission || "view");
  res.json({ message: "Chia sẻ thư mục thành công", folder });
});

export const removeFolderShare = asyncHandler(async (req, res) => {
  const { folderId, email } = req.params;
  const folder = await folderService.removeFolderShare(folderId, req.user.userId, email);
  res.json({ message: "Đã hủy chia sẻ", folder });
});
