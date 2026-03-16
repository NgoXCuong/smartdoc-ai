import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.flatten().fieldErrors;

    const firstField = Object.keys(formattedErrors)[0];
    const message = formattedErrors[firstField][0];

    return res.status(400).json({
      message: message || "Dữ liệu không hợp lệ",
    });
  }
  next();
};

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn" });
    }
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
