import express from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import chatRouter from "./chat.routes.js";
import adminRoutes from "./admin.routes.js";
import folderRoutes from "./folder.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/docs", documentRoutes);
router.use("/chat", chatRouter);
router.use("/admin", adminRoutes);
router.use("/folders", folderRoutes);

export default router;
