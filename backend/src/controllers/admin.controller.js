import User from "../models/user.model.js";
import Document from "../models/document.model.js";
import ChatSession from "../models/chatSession.model.js";
import UsageLog from "../models/usageLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return res.status(200).json({ success: true, users });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("Không tìm thấy người dùng để xóa");
  return res.status(200).json({ success: true, message: "Đã xóa người dùng thành công" });
});

export const getSystemStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalDocs, totalChats, totalStorage] = await Promise.all([
    User.countDocuments(),
    Document.countDocuments(),
    ChatSession.countDocuments(),
    Document.aggregate([
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalDocs,
      totalChats,
      totalStorageBytes: totalStorage[0]?.totalSize || 0
    }
  });
});

export const getUsageStats = asyncHandler(async (req, res) => {
  const stats = await UsageLog.aggregate([
    {
      $group: {
        _id: "$type",
        totalTokens: { $sum: "$tokens" },
        avgProcessingTime: { $avg: "$processingTime" },
        count: { $sum: 1 }
      }
    }
  ]);

  // Lấy dữ liệu theo ngày trong 7 ngày qua
  const last7Days = await UsageLog.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        tokens: { $sum: "$tokens" },
        chats: { 
          $sum: { $cond: [{ $eq: ["$type", "chat"] }, 1, 0] } 
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return res.status(200).json({
    success: true,
    stats,
    timeline: last7Days
  });
});
