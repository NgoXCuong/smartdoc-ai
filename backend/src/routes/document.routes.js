import express from "express";
import { uploadDocument } from "../controllers/document.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/upload", verifyToken, uploadDocument);

export default router;
