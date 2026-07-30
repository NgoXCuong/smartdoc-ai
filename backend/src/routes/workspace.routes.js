import express from "express";
import multer from "multer";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  generateInviteCode,
  getWorkspaceByInviteCode,
  joinByInviteCode,
  updateAvatar,
  uploadWorkspaceAvatarFile,
} from "../controllers/workspace.controller.js";
import {
  getGroupChatHistory,
  deleteGroupChatMessage,
} from "../controllers/groupChat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public / Semi-public routes
router.get("/invite-info/:inviteCode", getWorkspaceByInviteCode);

router.use(verifyToken);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

router.post("/upload-avatar", upload.single("avatar"), uploadWorkspaceAvatarFile);

router.post("/:id/members", addMember);
router.delete("/:id/members/:memberId", removeMember);

// Invite code & Public Join routes
router.post("/:id/invite-code", generateInviteCode);
router.post("/join/:inviteCode", joinByInviteCode);
router.post("/:id/avatar", updateAvatar);

// Group Chat Routes
router.get("/:id/chat", getGroupChatHistory);
router.delete("/:id/chat/:messageId", deleteGroupChatMessage);

export default router;
