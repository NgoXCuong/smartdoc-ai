import express from "express";
import multer from "multer";
import {
  deleteDocument,
  getDocumentInfo,
  getDocuments,
  uploadDocument,
  shareDocument,
  removeDocumentShare,
  extractDocumentData,
  getProcessingJob,
  uploadNewVersion,
  getVersionHistory,
  restoreVersion
} from "../controllers/document.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", verifyToken, upload.single("file"), uploadDocument);
router.get("/", verifyToken, getDocuments);
router.get("/:id", verifyToken, getDocumentInfo);
router.get("/:id/job", verifyToken, getProcessingJob);
router.delete("/:id", verifyToken, deleteDocument);
router.post("/:id/share", verifyToken, shareDocument);
router.delete("/:id/share/:email", verifyToken, removeDocumentShare);
router.post("/:id/extract", verifyToken, extractDocumentData);

// Quản lý phiên bản tài liệu
router.post("/:id/versions", verifyToken, upload.single("file"), uploadNewVersion);
router.get("/:id/versions", verifyToken, getVersionHistory);
router.post("/:id/restore/:version", verifyToken, restoreVersion);

export default router;
