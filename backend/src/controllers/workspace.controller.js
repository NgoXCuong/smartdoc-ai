import workspaceService from "../services/workspace.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import storageService from "../services/storage.service.js";

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, "Tên không gian làm việc là bắt buộc");

  const workspace = await workspaceService.createWorkspace(req.user.userId, name, description);
  res.status(201).json({ success: true, workspace });
});

export const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspacesByUser(req.user.userId);
  res.status(200).json({ success: true, workspaces });
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await workspaceService.getWorkspaceById(id, req.user.userId);
  res.status(200).json({ success: true, workspace });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await workspaceService.updateWorkspace(id, req.user.userId, req.body);
  res.status(200).json({ success: true, workspace });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await workspaceService.deleteWorkspace(id, req.user.userId);
  res.status(200).json({ success: true, message: "Đã xóa không gian làm việc" });
});

export const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email) throw new ApiError(400, "Email là bắt buộc");

  const workspace = await workspaceService.addMember(id, req.user.userId, email, role);
  res.status(200).json({ success: true, message: "Đã thêm thành viên", workspace });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;
  const workspace = await workspaceService.removeMember(id, req.user.userId, memberId);
  res.status(200).json({ success: true, message: "Đã xóa thành viên", workspace });
});

export const generateInviteCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await workspaceService.generateInviteCode(id, req.user.userId);
  res.status(200).json({ success: true, message: "Đã tạo mã mời mới", inviteCode: workspace.inviteCode, workspace });
});

export const getWorkspaceByInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const workspace = await workspaceService.getWorkspaceByInviteCode(inviteCode);
  res.status(200).json({ success: true, workspace });
});

export const joinByInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const workspace = await workspaceService.joinByInviteCode(inviteCode, req.user.userId);
  res.status(200).json({ success: true, message: "Gia nhập Workspace thành công", workspace });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { avatar } = req.body;
  const workspace = await workspaceService.updateAvatar(id, req.user.userId, avatar);
  res.status(200).json({ success: true, message: "Cập nhật ảnh đại diện thành công", workspace });
});

export const uploadWorkspaceAvatarFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Vui lòng chọn 1 tệp hình ảnh");
  }
  const uploadResult = await storageService.uploadDocument(req.file);
  res.status(200).json({
    success: true,
    message: "Tải ảnh đại diện thành công",
    avatarUrl: uploadResult.fileUrl,
  });
});
