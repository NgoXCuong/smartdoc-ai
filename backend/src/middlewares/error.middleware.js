import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * @description Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Check if the error is an instance of ApiError, if not, convert it
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  // Log the error using Winston
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.url} - ${error.message}`, {
      stack: error.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.url} - ${error.message}`);
  }

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
