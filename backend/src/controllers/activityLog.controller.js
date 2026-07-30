import activityLogService from "../services/activityLog.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { workspaceId, page, limit, action } = req.query;

  const result = await activityLogService.getActivityLogs({
    userId: workspaceId ? null : userId, // Nếu có workspaceId thì lấy theo workspace, không thì lấy theo user
    workspaceId: workspaceId || null,
    page: page || 1,
    limit: limit || 20,
    action,
  });

  return res.status(200).json({
    success: true,
    ...result,
  });
});
