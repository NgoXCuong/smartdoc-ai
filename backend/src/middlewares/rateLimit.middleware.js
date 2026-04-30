import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

/**
 * @description Standard rate limiter for general API routes
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: "draft-7", // Use modern rate limit headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    throw new ApiError(
      429,
      "Too many requests from this IP, please try again after 15 minutes",
    );
  },
});

/**
 * @description Stricter rate limiter for sensitive routes like Auth and AI
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 500, // Limit each IP to 500 requests per hour for auth/AI
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new ApiError(
      429,
      "Too many attempts, please try again after an hour",
    );
  },
});
