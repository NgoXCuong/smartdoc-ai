import express from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";
import chatRouter from "./chat.routes.js";
import adminRoutes from "./admin.routes.js";
import folderRoutes from "./folder.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import usageRoutes from "./usage.routes.js";
import notificationRoutes from "./notification.routes.js";
import activityLogRoutes from "./activityLog.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/docs", documentRoutes);
router.use("/chat", chatRouter);
router.use("/admin", adminRoutes);
router.use("/folders", folderRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/usage", usageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activity-logs", activityLogRoutes);

export default router;
