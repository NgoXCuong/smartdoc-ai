import UsageLog from "../models/usageLog.model.js";
import logger from "../utils/logger.js";

export const logUsage = async ({ userId, type, tokens = 0, processingTime = 0, status = "success", metadata = {} }) => {
  try {
    await UsageLog.create({
      userId,
      type,
      tokens,
      processingTime,
      status,
      metadata
    });
  } catch (error) {
    logger.error("[UsageLog] Error logging usage:", error);
  }
};
