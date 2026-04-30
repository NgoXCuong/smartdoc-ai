import express from "express";
import { getAllUsers, deleteUser, getSystemStats } from "../controllers/admin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Tất cả route trong admin đều yêu cầu Đăng nhập và là Admin
router.use(verifyToken, isAdmin);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/stats", getSystemStats);

export default router;
