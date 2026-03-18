import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  profileUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import {
  registerLimiter,
  validate,
  verifyToken,
} from "../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  checkEmailForgotPassSchema,
  resetPasswordSchema,
} from "../validations/auth.validation.js";
import { loginLimiter } from "../middlewares/auth.middleware.js";
import authService from "../services/auth.service.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API quản lý xác thực người dùng (Đăng ký, Đăng nhập, ..)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 */
router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  registerUser,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về Token
 *       401:
 *         description: Email hoặc mật khẩu không chính xác
 */
router.post("/login", loginLimiter, validate(loginSchema), loginUser);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token
 *     tags: [Auth]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh Token được lưu trong HttpOnly Cookie
 *     responses:
 *       200:
 *         description: Trả về access token mới
 *       401:
 *         description: Refresh token không hợp lệ hoặc không được cung cấp
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa xác thực
 */
router.post("/logout", verifyToken, logoutUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng
 *       401:
 *         description: Chưa xác thực
 */
router.get("/me", verifyToken, profileUser);

router.put(
  "/change-password",
  verifyToken,
  validate(changePasswordSchema),
  changePassword,
);

router.post(
  "/forgot-password",
  validate(checkEmailForgotPassSchema),
  forgotPassword,
);

router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);

router.post("/verify-email/:token", verifyEmail);

export default router;
