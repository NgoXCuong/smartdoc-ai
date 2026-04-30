import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new ApiError(
      429,
      "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    );
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new ApiError(
      429,
      "Quá nhiều yêu cầu tạo tài khoản từ IP này, vui lòng thử lại sau 1 giờ.",
    );
  },
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.flatten().fieldErrors;

    const firstField = Object.keys(formattedErrors)[0];
    const message = formattedErrors[firstField][0];

    throw new ApiError(400, message || "Dữ liệu không hợp lệ", formattedErrors);
  }
  next();
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Vui lòng đăng nhập");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token đã hết hạn");
    }
    throw new ApiError(401, "Token không hợp lệ");
  }
};
