import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat_session",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      default: "",
    },
    answer: {
      type: String,
      default: "",
    },
    model: {
      type: String,
      default: "gemini-flash-latest",
    },
    temperature: {
      type: Number,
      default: 0.3,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    latency: {
      type: Number,
      default: 0, // ms
    },
    metadata: {
      sources: [
        {
          docId: mongoose.Schema.Types.ObjectId,
          chunkId: String,
          fileName: String,
          pageNumber: Number,
          pageContent: String,
          similarityScore: Number,
        },
      ],
    },
  },
  { timestamps: true },
);

// Tối ưu truy xuất tin nhắn theo session và thời gian
messageSchema.index({ sessionId: 1, createdAt: 1 });

const Message = mongoose.model("message", messageSchema);

export default Message;