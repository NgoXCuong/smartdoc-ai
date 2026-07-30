import mongoose from "mongoose";

const processingJobSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "document",
      required: true,
      index: true,
    },
    currentStep: {
      type: String,
      enum: ["extract", "chunk", "embedding", "summary", "completed"],
      default: "extract",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    steps: {
      extract: {
        status: { type: String, default: "pending" },
        durationMs: { type: Number, default: 0 },
      },
      chunk: {
        status: { type: String, default: "pending" },
        totalChunks: { type: Number, default: 0 },
      },
      embedding: {
        status: { type: String, default: "pending" },
        progress: { type: Number, default: 0 },
      },
      summary: {
        status: { type: String, default: "pending" },
      },
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ProcessingJob = mongoose.model("processing_job", processingJobSchema, "processing_jobs");

export default ProcessingJob;
