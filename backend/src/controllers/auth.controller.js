import authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const result = await authService.register(username, email, password);
  return res.status(201).json({
    success: true,
    ...result,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });

  return res.status(200).json({
    success: true,
    message: "Đăng nhập thành công",
    user,
    accessToken,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    throw new ApiError(401, "Vui lòng đăng nhập lại");
  }

  const { accessToken, newRefreshToken } = await authService.refreshToken(
    refreshTokenFromCookie,
  );

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });

  return res.status(200).json({
    success: true,
    message: "Làm mới token thành công",
    accessToken,
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const refreshTokenCookie = req.cookies?.refreshToken;
  const result = await authService.logout(userId, refreshTokenCookie);

  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const profileUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await authService.getProfile(userId);
  if (!user) {
    throw new ApiError(404, "Người dùng không tồn tại");
  }
  return res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;

  const result = await authService.changePassword(
    userId,
    oldPassword,
    newPassword,
  );

  return res.status(200).json({
    success: true,
    result,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Vui lòng cung cấp email của bạn");
  }

  const result = await authService.forgotPassword(email);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const result = await authService.resetPassword(token, password);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Không tìm thấy token xác thực!");
  }

  await authService.verifyEmail(token);

  return res.status(200).json({
    success: true,
    message: "Xác thực Email thành công! Bạn có thể đăng nhập ngay bây giờ",
  });
});
