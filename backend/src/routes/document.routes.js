import express from "express";
import multer from "multer";
import {
  deleteDocument,
  getDocumentInfo,
  getDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file vào RAM để buffer gửi lên Supabase

router.post("/upload", verifyToken, upload.single("file"), uploadDocument);
router.get("/", verifyToken, getDocuments);
router.get("/:id", verifyToken, getDocumentInfo);
router.delete("/:id", verifyToken, deleteDocument);

export default router;
