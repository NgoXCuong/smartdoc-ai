import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
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
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    fileUrl: { type: String, required: true },
    cloudFileId: { type: String, required: true },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    vectorNamespace: { type: String, default: null, index: true },
    totalChunks: { type: Number, default: 0 },
    summary: { type: String, default: null },
    suggestedQuestions: [{ type: String }],
    errorMessage: { type: String, default: null },
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        permission: { type: String, enum: ["view", "chat"], default: "view" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

documentSchema.index({ userId: 1, createAt: -1 });

const Document = mongoose.model("document", documentSchema, "file_metadata");

export default Document;
