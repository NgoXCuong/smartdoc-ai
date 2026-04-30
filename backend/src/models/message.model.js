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
    metadata: {
      sources: [
        {
          docId: mongoose.Schema.Types.ObjectId,
          fileName: String,
          pageNumber: Number,
          pageContent: String,
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