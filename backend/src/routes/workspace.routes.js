import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember
} from "../controllers/workspace.controller.js";
import {
  getGroupChatHistory,
  deleteGroupChatMessage,
} from "../controllers/groupChat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

router.post("/:id/members", addMember);
router.delete("/:id/members/:memberId", removeMember);

// Group Chat Routes
router.get("/:id/chat", getGroupChatHistory);
router.delete("/:id/chat/:messageId", deleteGroupChatMessage);

export default router;
