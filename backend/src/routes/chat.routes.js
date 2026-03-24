import express from "express";
import {
  askDocument,
  getAllChatByUser,
  getChatHistory,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/ask", verifyToken, askDocument);
router.get("/history", verifyToken, getAllChatByUser);
router.get("/history/:sessionId", verifyToken, getChatHistory);

export default router;
