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
    color: {
      type: String,
      default: "#2563eb",
    },
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        permission: { type: String, enum: ["view", "chat"], default: "view" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Folder = mongoose.model("Folder", folderSchema);
export default Folder;
