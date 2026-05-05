import Workspace from "../models/workspace.model.js";
import User from "../models/user.model.js";

const workspaceService = {
  createWorkspace: async (ownerId, name, description) => {
    return await Workspace.create({
      name,
      description,
      ownerId,
      members: [{ user: ownerId, role: "admin" }],
    });
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
    return await workspace.save();
  },

  deleteWorkspace: async (workspaceId, userId) => {
    const workspace = await Workspace.findOneAndDelete({ _id: workspaceId, ownerId: userId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền xóa không gian làm việc");
    return workspace;
  },

  addMember: async (workspaceId, ownerId, targetEmail, role = "viewer") => {
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId });
    if (!workspace) throw new Error("Chỉ chủ sở hữu mới có quyền thêm thành viên");

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng không tồn tại");

    const existingMember = workspace.members.find(m => m.user.toString() === targetUser._id.toString());
    if (existingMember) {
      throw new Error("Người dùng đã là thành viên của không gian làm việc này");
    }

    workspace.members.push({ user: targetUser._id, role });
    await workspace.save();
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
    return workspace.populate("members.user", "username email avatar");
  },
};

export default workspaceService;
