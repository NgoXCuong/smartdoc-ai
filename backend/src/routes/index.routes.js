import express from "express";
import authRoutes from "./auth.routes.js";
import documentRoutes from "./document.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/document", documentRoutes);

export default router;
