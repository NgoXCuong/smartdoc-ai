import mongoose from "mongoose";
import UsageLog from "../models/usageLog.model.js";
import Document from "../models/document.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMeUsage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [totalDocs, totalStorage] = await Promise.all([
    Document.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    Document.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
    ])
  ]);

  const stats = await UsageLog.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$type",
        totalTokens: { $sum: "$tokens" },
        count: { $sum: 1 }
      }
    }
  ]);

  const last7Days = await UsageLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        tokens: { $sum: "$tokens" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return res.status(200).json({
    success: true,
    totalDocs,
    totalStorageBytes: totalStorage[0]?.totalSize || 0,
    stats,
    timeline: last7Days
  });
});
