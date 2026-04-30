import User from "../models/user.model.js";
import Document from "../models/document.model.js";
import ChatSession from "../models/chatSession.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return res.status(200).json({ success: true, users });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("Không tìm thấy người dùng để xóa");
  
  // (Tùy chọn) Xóa tài liệu của người dùng này
  // await Document.deleteMany({ userId: id });
  
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
