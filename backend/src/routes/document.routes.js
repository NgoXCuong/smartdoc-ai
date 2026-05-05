import express from "express";
import multer from "multer";
import {
  deleteDocument,
  getDocumentInfo,
  getDocuments,
  uploadDocument,
  shareDocument,
  removeDocumentShare,
  extractDocumentData
} from "../controllers/document.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file vào RAM để buffer gửi lên Supabase

router.post("/upload", verifyToken, upload.single("file"), uploadDocument);
router.get("/", verifyToken, getDocuments);
router.get("/:id", verifyToken, getDocumentInfo);
router.delete("/:id", verifyToken, deleteDocument);
router.post("/:id/share", verifyToken, shareDocument);
router.delete("/:id/share/:email", verifyToken, removeDocumentShare);
router.post("/:id/extract", verifyToken, extractDocumentData);

export default router;
