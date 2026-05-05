import Folder from "../models/folder.model.js";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";

const folderService = {
  createFolder: async (userId, name, color) => {
    return await Folder.create({ userId, name, color });
  },

  getFolders: async (userId) => {
    return await Folder.find({
      $or: [{ userId }, { "sharedWith.user": userId }]
    }).sort({ createdAt: -1 });
  },

  getFolder: async (folderId, userId) => {
    return await Folder.findOne({
      _id: folderId,
      $or: [{ userId }, { "sharedWith.user": userId }]
    });
  },

  updateFolder: async (folderId, userId, updateData) => {
    return await Folder.findOneAndUpdate(
      { _id: folderId, userId },
      { $set: updateData },
      { new: true }
    );
  },

  deleteFolder: async (folderId, userId) => {
    // Ungroup documents before deleting folder
    await Document.updateMany({ folderId, userId }, { $set: { folderId: null } });
    return await Folder.findOneAndDelete({ _id: folderId, userId });
  },

  moveDocumentToFolder: async (docId, folderId, userId) => {
    // If folderId is null, it moves doc to "Root"
    return await Document.findOneAndUpdate(
      { _id: docId, userId },
      { $set: { folderId: folderId } },
      { new: true }
    );
  },

  shareFolder: async (folderId, ownerId, targetEmail, permission) => {
    const folder = await Folder.findOne({ _id: folderId, userId: ownerId });
    if (!folder) throw new Error("Thư mục không tồn tại hoặc bạn không có quyền");
    
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng với email này không tồn tại");
    if (targetUser._id.toString() === ownerId.toString()) throw new Error("Không thể chia sẻ cho chính mình");

    const existingShareIndex = folder.sharedWith.findIndex(s => s.user.toString() === targetUser._id.toString());
    if (existingShareIndex !== -1) {
      folder.sharedWith[existingShareIndex].permission = permission;
    } else {
      folder.sharedWith.push({ user: targetUser._id, permission });
    }
    
    return await folder.save();
  },

  removeFolderShare: async (folderId, ownerId, targetEmail) => {
    const folder = await Folder.findOne({ _id: folderId, userId: ownerId });
    if (!folder) throw new Error("Thư mục không tồn tại hoặc bạn không có quyền");
    
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng không tồn tại");

    folder.sharedWith = folder.sharedWith.filter(s => s.user.toString() !== targetUser._id.toString());
    return await folder.save();
  }
};

export default folderService;
