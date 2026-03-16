import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true,
    },
    fileName: { type: String, require: true, trim: true },
    fileType: { type: String, require: true },
    fileSize: { type: Number, require: true },
    fileUrl: { type: String, require: true },
    clouFileId: { type: String, require: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    vectorNamespace: { type: String, default: null, index: true },
    totolChunks: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true },
);

documentSchema.index({ userId: 1, createAt: -1 });

const Document = mongoose.model("document", documentSchema);

export default Document;
