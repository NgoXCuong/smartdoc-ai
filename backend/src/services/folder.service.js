import Folder from "../models/folder.model.js";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";

const folderService = {
  createFolder: async (userId, name, color, parentFolderId = null, workspaceId = null) => {
    let path = [];
    let resolvedWorkspaceId = workspaceId || null;

    if (parentFolderId) {
      const parentFolder = await Folder.findOne({
        _id: parentFolderId,
        $or: [{ userId }, { "sharedWith.user": userId }],
      });
      if (!parentFolder) {
        throw new Error("Thư mục cha không tồn tại hoặc bạn không có quyền truy cập");
      }
      path = [...(parentFolder.path || []), parentFolder._id];
      resolvedWorkspaceId = resolvedWorkspaceId || parentFolder.workspaceId || null;
    }

    return await Folder.create({
      userId,
      name,
      color: color || "#2563eb",
      parentFolderId: parentFolderId || null,
      path,
      workspaceId: resolvedWorkspaceId,
    });
  },

  getFolders: async (userId, parentFolderId = null, workspaceId = null) => {
    const query = {
      $or: [{ userId }, { "sharedWith.user": userId }],
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
    } else {
      query.workspaceId = null;
    }

    if (parentFolderId && parentFolderId !== "all") {
      query.parentFolderId = parentFolderId === "null" ? null : parentFolderId;
    } else if (parentFolderId !== "all") {
      query.parentFolderId = null; // Mặc định chỉ lấy các thư mục ở Root
    }

    const folders = await Folder.find(query).sort({ createdAt: -1 });

    return await Promise.all(
      folders.map(async (folder) => {
        const docCount = await Document.countDocuments({ folderId: folder._id });
        const subFolderCount = await Folder.countDocuments({ parentFolderId: folder._id });
        return {
          ...folder.toObject(),
          docCount,
          subFolderCount,
        };
      })
    );
  },

  getFolder: async (folderId, userId) => {
    const folder = await Folder.findOne({
      _id: folderId,
      $or: [{ userId }, { "sharedWith.user": userId }],
    });
    if (!folder) return null;

    const docCount = await Document.countDocuments({ folderId: folder._id });
    const subFolderCount = await Folder.countDocuments({ parentFolderId: folder._id });

    return {
      ...folder.toObject(),
      docCount,
      subFolderCount,
    };
  },

  getFolderBreadcrumbs: async (folderId, userId) => {
    const folder = await Folder.findOne({
      _id: folderId,
      $or: [{ userId }, { "sharedWith.user": userId }],
    });

    if (!folder) return [];

    const breadcrumbs = [];

    if (folder.path && folder.path.length > 0) {
      const ancestors = await Folder.find({ _id: { $in: folder.path } }).select("_id name color");
      const ancestorMap = new Map(ancestors.map((a) => [a._id.toString(), a]));

      folder.path.forEach((pId) => {
        const item = ancestorMap.get(pId.toString());
        if (item) breadcrumbs.push({ _id: item._id, name: item.name, color: item.color });
      });
    }

    breadcrumbs.push({ _id: folder._id, name: folder.name, color: folder.color });
    return breadcrumbs;
  },

  updateFolder: async (folderId, userId, updateData) => {
    return await Folder.findOneAndUpdate(
      { _id: folderId, userId },
      { $set: updateData },
      { returnDocument: "after" }
    );
  },

  moveFolder: async (folderId, targetParentFolderId, userId) => {
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) throw new Error("Thư mục không tồn tại hoặc bạn không có quyền");

    let newPath = [];

    if (targetParentFolderId) {
      if (targetParentFolderId.toString() === folderId.toString()) {
        throw new Error("Không thể di chuyển thư mục vào chính nó");
      }

      const targetParent = await Folder.findOne({ _id: targetParentFolderId, userId });
      if (!targetParent) throw new Error("Thư mục đích không tồn tại");

      // Kiểm tra vòng lặp: Thư mục đích không được là thư mục con của thư mục hiện tại
      if (targetParent.path.some((id) => id.toString() === folderId.toString())) {
        throw new Error("Không thể di chuyển thư mục cha vào trong thư mục con của nó");
      }

      newPath = [...(targetParent.path || []), targetParent._id];
      folder.parentFolderId = targetParent._id;
    } else {
      folder.parentFolderId = null;
      newPath = [];
    }

    folder.path = newPath;
    await folder.save();

    // Cập nhật đệ quy mảng path cho tất cả thư mục con cấp dưới
    const subfolders = await Folder.find({ path: folderId, userId });
    for (const sub of subfolders) {
      const folderIdIndex = sub.path.findIndex((id) => id.toString() === folderId.toString());
      if (folderIdIndex !== -1) {
        const remainingPath = sub.path.slice(folderIdIndex + 1);
        sub.path = [...newPath, folder._id, ...remainingPath];
        await sub.save();
      }
    }

    return folder;
  },

  deleteFolder: async (folderId, userId) => {
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) throw new Error("Thư mục không tồn tại hoặc bạn không có quyền");

    // Lấy toàn bộ thư mục con cấp dưới (định vị qua parentFolderId hoặc path)
    const subfolders = await Folder.find({
      userId,
      $or: [{ _id: folderId }, { parentFolderId: folderId }, { path: folderId }],
    });

    const folderIds = subfolders.map((f) => f._id);

    // Đưa tất cả tài liệu trong các thư mục này ra ngoài Root (folderId: null)
    await Document.updateMany({ folderId: { $in: folderIds }, userId }, { $set: { folderId: null } });

    // Xóa tất cả thư mục thuộc cây thư mục này
    await Folder.deleteMany({ _id: { $in: folderIds }, userId });

    return { message: `Đã xóa thư mục và ${folderIds.length - 1} thư mục con` };
  },

  moveDocumentToFolder: async (docId, folderId, userId) => {
    // If folderId is null, it moves doc to "Root"
    return await Document.findOneAndUpdate(
      { _id: docId, userId },
      { $set: { folderId: folderId || null } },
      { returnDocument: "after" }
    );
  },

  shareFolder: async (folderId, ownerId, targetEmail, permission) => {
    const folder = await Folder.findOne({ _id: folderId, userId: ownerId });
    if (!folder) throw new Error("Thư mục không tồn tại hoặc bạn không có quyền");

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) throw new Error("Người dùng với email này không tồn tại");
    if (targetUser._id.toString() === ownerId.toString()) throw new Error("Không thể chia sẻ cho chính mình");

    const existingShareIndex = folder.sharedWith.findIndex((s) => s.user.toString() === targetUser._id.toString());
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

    folder.sharedWith = folder.sharedWith.filter((s) => s.user.toString() !== targetUser._id.toString());
    return await folder.save();
  },
};

export default folderService;
