import express from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import chatRouter from "./chat.routes.js";
import adminRoutes from "./admin.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/docs", documentRoutes);
router.use("/chat", chatRouter);
router.use("/admin", adminRoutes);

export default router;
