import mongoose from "mongoose";

const workspaceMessageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null, // null = tin nhắn từ AI Bot
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    // "text" = tin nhắn thường, "ai_response" = AI trả lời từ @AI mention
    type: {
      type: String,
      enum: ["text", "ai_response"],
      default: "text",
    },
    // true nếu tin nhắn này có chứa @AI
    aiMentioned: {
      type: Boolean,
      default: false,
    },
    // Nguồn tài liệu nếu là AI response (RAG sources)
    sources: [
      {
        docId: { type: mongoose.Schema.Types.ObjectId, ref: "document" },
        fileName: String,
        pageNumber: Number,
      },
    ],
    // Trạng thái tin nhắn đã bị xóa (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index compound để tối ưu query lấy lịch sử chat theo workspace + thời gian
workspaceMessageSchema.index({ workspaceId: 1, createdAt: -1 });

const WorkspaceMessage = mongoose.model(
  "workspace_message",
  workspaceMessageSchema
);

export default WorkspaceMessage;
