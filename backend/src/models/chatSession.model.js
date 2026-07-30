import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    docIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "document",
        required: true,
      },
    ],
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    mode: {
      type: String,
      enum: ["personal", "workspace"],
      default: "personal",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Cuộc trò chuyện mới",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    temperature: {
      type: Number,
      default: 0.3,
    },
    model: {
      type: String,
      default: "gemini-flash-latest",
    },
  },
  { timestamps: true },
);

const ChatSession = mongoose.model("chat_session", chatSessionSchema);

export default ChatSession;
