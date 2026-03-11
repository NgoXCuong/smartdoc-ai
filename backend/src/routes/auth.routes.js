import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  profileUser,
} from "../controllers/auth.controller.js";
import { validate, verifyToken } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { loginLimiter } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", verifyToken, logoutUser);
router.get("/me", verifyToken, profileUser);

export default router;
