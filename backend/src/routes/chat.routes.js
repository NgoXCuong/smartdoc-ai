import express from "express";
import {
  askDocument,
  getAllChatByUser,
  getChatHistory,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.use(authLimiter);

router.post("/ask", askDocument);
router.get("/history", verifyToken, getAllChatByUser);
router.get("/history/:sessionId", verifyToken, getChatHistory);

export default router;
