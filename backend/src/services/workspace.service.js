import crypto from "crypto";
import Workspace from "../models/workspace.model.js";
import User from "../models/user.model.js";
import notificationService from "./notification.service.js";
import activityLogService from "./activityLog.service.js";

const workspaceService = {
  createWorkspace: async (ownerId, name, description) => {
    const ws = await Workspace.create({
      name,
      description,
      ownerId,
      members: [{ user: ownerId, role: "admin" }],
    });

    await activityLogService.logActivity({
      userId: ownerId,
      workspaceId: ws._id,
      action: "CREATE_WORKSPACE",
      targetId: ws._id,
      targetType: "workspace",
      details: { name, description },
    });

    return ws;
  },

  getWorkspacesByUser: async (userId) => {
    return await Workspace.find({
      $or: [{ ownerId: userId }, { "members.user": userId }],
    }).populate("members.user", "username email avatar");
  },

  getWorkspaceById: async (workspaceId, userId) => {
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ ownerId: userId }, { "members.user": userId }],
    }).populate("members.user", "username email avatar");

    if (!workspace) {
      throw new Error("Không tìm thấy không gian làm việc hoặc bạn không có quyền");
    }
    return workspace;
  },

  updateWorkspace: async (workspaceId, userId, updateData) => {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: userId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền cập nhật không gian làm việc");

    Object.assign(workspace, updateData);
    const updated = await workspace.save();

    await activityLogService.logActivity({
      userId,
      workspaceId,
      action: "UPDATE_WORKSPACE",
      targetId: workspaceId,
      targetType: "workspace",
      details: updateData,
    });

    return updated;
  },

  deleteWorkspace: async (workspaceId, userId) => {
    const workspace = await Workspace.findOneAndDelete({ _id: workspaceId, ownerId: userId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền xóa không gian làm việc");

    await activityLogService.logActivity({
      userId,
      workspaceId,
      action: "DELETE_WORKSPACE",
      targetId: workspaceId,
      targetType: "workspace",
      details: { name: workspace.name },
    });

    return workspace;
  },

  addMember: async (workspaceId, ownerId, targetEmail, role = "viewer") => {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId }).populate("ownerId", "name email");
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền thêm thành viên");

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng không tồn tại");

    const existingMember = workspace.members.find(m => m.user.toString() === targetUser._id.toString());
    if (existingMember) {
      throw new Error("Người dùng đã là thành viên của không gian làm việc này");
    }

    workspace.members.push({ user: targetUser._id, role });
    await workspace.save();

    // Gửi thông báo cho thành viên mới
    await notificationService.createNotification({
      recipientId: targetUser._id,
      senderId: ownerId,
      type: "INVITE_WORKSPACE",
      title: "Lời mời tham gia Workspace",
      message: `Bạn vừa được ${workspace.ownerId?.name || 'Chủ sở hữu'} thêm vào Workspace "${workspace.name}" với vai trò ${role === 'admin' ? 'Quản trị' : 'Thành viên'}.`,
      link: `/workspaces/${workspace._id}`,
      metadata: { workspaceId: workspace._id, role },
    });

    // Log Activity
    await activityLogService.logActivity({
      userId: ownerId,
      workspaceId: workspace._id,
      action: "JOIN_WORKSPACE",
      targetId: targetUser._id,
      targetType: "user",
      details: { memberEmail: targetEmail, role },
    });

    return workspace.populate("members.user", "username email avatar");
  },

  removeMember: async (workspaceId, ownerId, memberId) => {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền xóa thành viên");

    if (ownerId.toString() === memberId.toString()) {
      throw new Error("Không thể xóa chính mình khỏi không gian làm việc");
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== memberId.toString());
    await workspace.save();

    await activityLogService.logActivity({
      userId: ownerId,
      workspaceId: workspace._id,
      action: "LEAVE_WORKSPACE",
      targetId: memberId,
      targetType: "user",
      details: { memberId },
    });

    return workspace.populate("members.user", "username email avatar");
  },

  generateInviteCode: async (workspaceId, ownerId) => {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền tạo/reset mã mời");

    const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    workspace.inviteCode = newCode;
    workspace.isPublic = true;
    await workspace.save();
    return workspace;
  },

  getWorkspaceByInviteCode: async (inviteCode) => {
    const workspace = await Workspace.findOne({ inviteCode })
      .populate("ownerId", "name email avatar")
      .select("name description avatar inviteCode isPublic ownerId members createdAt");

    if (!workspace) {
      throw new Error("Mã mời không tồn tại hoặc đã bị hủy bỏ");
    }

    return {
      _id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      owner: workspace.ownerId,
      memberCount: workspace.members.length,
      createdAt: workspace.createdAt,
    };
  },

  joinByInviteCode: async (inviteCode, userId) => {
    const workspace = await Workspace.findOne({ inviteCode }).populate("ownerId", "name email");
    if (!workspace) throw new Error("Mã mời không tồn tại hoặc đã bị hủy bỏ");

    const isMember = workspace.members.some(m => m.user.toString() === userId.toString());
    if (isMember) {
      return workspace;
    }

    const joiningUser = await User.findById(userId);

    workspace.members.push({ user: userId, role: "viewer" });
    await workspace.save();

    // Thông báo cho chủ sở hữu
    await notificationService.createNotification({
      recipientId: workspace.ownerId._id,
      senderId: userId,
      type: "INVITE_WORKSPACE",
      title: "Thành viên mới gia nhập",
      message: `${joiningUser?.name || 'Một người dùng'} vừa tham gia Workspace "${workspace.name}" qua mã mời.`,
      link: `/workspaces/${workspace._id}`,
      metadata: { workspaceId: workspace._id, userId },
    });

    // Log Activity
    await activityLogService.logActivity({
      userId,
      workspaceId: workspace._id,
      action: "JOIN_WORKSPACE",
      targetId: workspace._id,
      targetType: "workspace",
      details: { inviteCode },
    });

    return workspace;
  },

  updateAvatar: async (workspaceId, ownerId, avatarUrl) => {
    const workspace = await Workspace.findOneAndUpdate(
      { _id: workspaceId, ownerId },
      { avatar: avatarUrl },
      { returnDocument: "after" }
    );
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền thay đổi ảnh đại diện");
    return workspace;
  },
};

export default workspaceService;
