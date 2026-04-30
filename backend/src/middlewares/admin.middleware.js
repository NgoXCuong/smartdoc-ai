import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    next(new ApiError(403, "Bạn không có quyền truy cập tính năng này (Yêu cầu quyền Admin)"));
  }
};
