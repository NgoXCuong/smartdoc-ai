import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
      },
    ],
    color: {
      type: String,
      default: "#2563eb",
    },
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        permission: { type: String, enum: ["view", "chat"], default: "view" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

folderSchema.index({ userId: 1, parentFolderId: 1 });

const Folder = mongoose.model("Folder", folderSchema);
export default Folder;
