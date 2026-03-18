import { success } from "zod";
import authService from "../services/auth.service.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await authService.register(username, email, password);
    return res
      .status(201)
      .json({ message: "Đăng ký thành công", user: newUser });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
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
      message: "Đăng nhập thành công",
      user,
      accessToken,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: "Vui lòng đăng nhập lại" });
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
      message: "Làm mới token thành công",
      accessToken,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const refreshTokenCookie = req.cookies?.refreshToken;
    const result = await authService.logout(userId, refreshTokenCookie);

    res.clearCookie("refreshToken");

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const profileUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await authService.getProfile(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const result = await authService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp email của bạn" });

    const result = await authService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const result = await authService.resetPassword(token, password);

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy token xác thực!" });
    }

    await authService.verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: "Xác thực Email thành công! Bạn có thể đăng nhập ngay bây giờ",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
