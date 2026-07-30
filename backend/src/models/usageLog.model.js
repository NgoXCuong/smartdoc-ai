import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["chat", "embedding", "summary"],
      required: true,
    },
    model: {
      type: String,
      default: "gemini-flash-latest",
    },
    cost: {
      type: Number,
      default: 0,
    },
    ip: {
      type: String,
      default: "",
    },
    endpoint: {
      type: String,
      default: "",
    },
    tokens: {
      type: Number,
      default: 0,
    },
    processingTime: {
      type: Number, // ms
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const UsageLog = mongoose.model("UsageLog", usageLogSchema);
export default UsageLog;
