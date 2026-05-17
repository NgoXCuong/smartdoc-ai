import express from "express";
import { getMeUsage } from "../controllers/usage.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.get("/me", getMeUsage);

export default router;
