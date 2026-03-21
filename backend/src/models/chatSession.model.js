import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "document",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: "Cuộc trò chuyện mới",
  },
}, { timestamps: true });

const ChatSession = mongoose.model("chat_session", chatSessionSchema);

export default ChatSession;
