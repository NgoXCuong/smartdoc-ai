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
    tags: [{ type: String }],
    suggestedQuestions: [{ type: String }],
    errorMessage: { type: String, default: null },

    // Metadata mở rộng
    language: { type: String, default: "vi" },
    pageCount: { type: Number, default: 0 },
    processingStartedAt: { type: Date },
    processingFinishedAt: { type: Date },
    embeddingModel: { type: String, default: "gemini-embedding-001" },
    summaryModel: { type: String, default: "gemini-flash-latest" },
    chunkSize: { type: Number, default: 2500 },
    chunkOverlap: { type: Number, default: 500 },
    ocrEnabled: { type: Boolean, default: false },
    lastIndexedAt: { type: Date },

    // Quản lý phiên bản tài liệu (Document Versioning)
    version: { type: Number, default: 1, min: 1 },
    versionHistory: [
      {
        version: { type: Number, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        cloudFileId: { type: String, required: true },
        summary: { type: String },
        totalChunks: { type: Number, default: 0 },
        changeLog: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      },
    ],
  },
  { timestamps: true },
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, workspaceId: 1, createdAt: -1 });
documentSchema.index({ folderId: 1, status: 1 });
documentSchema.index({ workspaceId: 1 });

const Document = mongoose.model("document", documentSchema, "documents");

export default Document;
