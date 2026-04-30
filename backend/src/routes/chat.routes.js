import express from "express";
import {
  askDocument,
  getAllChatByUser,
  getChatHistory,
  updateChatSession,
  deleteChatSession,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.use(authLimiter);

router.post("/ask", askDocument);
router.get("/history", verifyToken, getAllChatByUser);
router.get("/history/:sessionId", verifyToken, getChatHistory);
router.patch("/history/:sessionId", verifyToken, updateChatSession);
router.delete("/history/:sessionId", verifyToken, deleteChatSession);

export default router;
