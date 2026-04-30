import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["chat", "embedding", "summary"],
      required: true,
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
