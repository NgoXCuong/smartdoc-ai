import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true, // "UPLOAD_FILE", "DELETE_FILE", "SHARE_DOC", "CREATE_WORKSPACE", "JOIN_WORKSPACE", "LEAVE_WORKSPACE", etc.
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String, // "document", "workspace", "folder", "user"
      default: null,
    },
    details: {
      type: Object,
      default: {},
    },
    ip: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ workspaceId: 1, createdAt: -1 });

const ActivityLog = mongoose.model("activity_log", activityLogSchema, "activity_logs");

export default ActivityLog;
