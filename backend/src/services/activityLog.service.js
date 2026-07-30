import ActivityLog from "../models/activityLog.model.js";
import logger from "../utils/logger.js";

const activityLogService = {
  logActivity: async ({ userId, workspaceId = null, action, targetId = null, targetType = null, details = {}, ip = "" }) => {
    try {
      const log = await ActivityLog.create({
        userId,
        workspaceId,
        action,
        targetId,
        targetType,
        details,
        ip,
      });
      return log;
    } catch (error) {
      logger.error("Lỗi ghi nhận activity log:", error);
      // Không throw error để không làm sập luồng chính của ứng dụng
      return null;
    }
  },

  getActivityLogs: async ({ userId, workspaceId, page = 1, limit = 20, action }) => {
    const query = {};

    if (workspaceId) {
      query.workspaceId = workspaceId;
    } else if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name email avatar"),
      ActivityLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  },
};

export default activityLogService;
