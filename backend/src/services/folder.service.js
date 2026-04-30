import Folder from "../models/folder.model.js";
import Document from "../models/document.model.js";

const folderService = {
  createFolder: async (userId, name, color) => {
    return await Folder.create({ userId, name, color });
  },

  getFolders: async (userId) => {
    return await Folder.find({ userId }).sort({ createdAt: -1 });
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
  }
};

export default folderService;
