import express from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import chatRouter from "./chat.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/docs", documentRoutes);
router.use("/chat", chatRouter);

export default router;
