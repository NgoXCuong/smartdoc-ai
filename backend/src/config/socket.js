import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import groupChatService from "../services/groupChat.service.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // ─── Middleware: Xác thực JWT cho Socket.io ───────────────────────────────
  io.use((socket, next) => {
    // Token có thể được gửi qua query param hoặc auth header
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      // Không có token → vẫn cho kết nối nhưng chưa xác thực
      // Chỉ các tính năng cơ bản (VD: document progress) mới hoạt động
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId?.toString();
      socket.userRole = decoded.role;
      logger.info(`[Socket] Xác thực thành công cho user: ${socket.userId}`);
      next();
    } catch (err) {
      logger.warn(`[Socket] Token không hợp lệ: ${err.message}`);
      socket.userId = null;
      next(); // Vẫn cho kết nối, nhưng không có userId
    }
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Client kết nối: ${socket.id} | userId: ${socket.userId || "chưa xác thực"}`);

    // ── DOCUMENT PROGRESS: Join room cá nhân (Dùng cho upload progress) ──────
    socket.on("join", (userId) => {
      if (userId) {
        const roomName = userId.toString();
        socket.join(roomName);
        logger.info(`[Socket] User ${userId} đã tham gia room cá nhân: ${roomName}`);
        socket.emit("joined", { room: roomName });
      }
    });

    // ── GROUP CHAT: Tham gia phòng chat của Workspace ─────────────────────────
    socket.on("join_workspace", async (workspaceId) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Vui lòng đăng nhập để tham gia chat" });
        return;
      }

      try {
        const isMember = await groupChatService.isMember(workspaceId, socket.userId);
        if (!isMember) {
          socket.emit("error", {
            message: "Bạn không phải thành viên của workspace này",
          });
          return;
        }

        const roomName = `workspace_${workspaceId}`;
        socket.join(roomName);
        socket.currentWorkspaceRoom = roomName;
        logger.info(`[Socket] User ${socket.userId} đã tham gia workspace room: ${roomName}`);

        // Thông báo cho các thành viên khác trong phòng
        socket.to(roomName).emit("workspace_member_joined", {
          userId: socket.userId,
          workspaceId,
        });

        socket.emit("workspace_joined", { workspaceId, room: roomName });
      } catch (error) {
        logger.error(`[Socket] Lỗi khi join workspace:`, error);
        socket.emit("error", { message: "Không thể tham gia phòng chat" });
      }
    });

    // ── GROUP CHAT: Rời phòng chat của Workspace ──────────────────────────────
    socket.on("leave_workspace", (workspaceId) => {
      const roomName = `workspace_${workspaceId}`;
      socket.leave(roomName);
      socket.currentWorkspaceRoom = null;
      logger.info(`[Socket] User ${socket.userId} đã rời workspace room: ${roomName}`);

      socket.to(roomName).emit("workspace_member_left", {
        userId: socket.userId,
        workspaceId,
      });
    });

    // ── GROUP CHAT: Gửi tin nhắn ──────────────────────────────────────────────
    socket.on("workspace_message", async ({ workspaceId, content }) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Vui lòng đăng nhập để gửi tin nhắn" });
        return;
      }

      if (!workspaceId || !content?.trim()) {
        socket.emit("error", { message: "Nội dung tin nhắn không được để trống" });
        return;
      }

      if (content.length > 5000) {
        socket.emit("error", { message: "Tin nhắn quá dài (tối đa 5000 ký tự)" });
        return;
      }

      try {
        const roomName = `workspace_${workspaceId}`;

        // Kiểm tra quyền thành viên trước khi gửi
        const isMember = await groupChatService.isMember(workspaceId, socket.userId);
        if (!isMember) {
          socket.emit("error", { message: "Bạn không có quyền chat trong workspace này" });
          return;
        }

        // Kiểm tra xem có mention @AI không
        const aiMentionRegex = /@AI\s+(.+)/i;
        const aiMatch = content.match(aiMentionRegex);
        const hasAIMention = !!aiMatch;

        // 1. Lưu và broadcast tin nhắn của user trước
        const userMessage = await groupChatService.saveMessage(
          workspaceId,
          socket.userId,
          content,
          hasAIMention
        );

        // Populate thông tin người dùng trước khi broadcast
        await userMessage.populate("senderId", "username email avatar");

        io.to(roomName).emit("workspace_new_message", {
          message: userMessage,
          workspaceId,
        });

        logger.info(
          `[Socket] Tin nhắn từ user ${socket.userId} trong workspace ${workspaceId}`
        );

        // 2. Nếu có @AI → gọi AI xử lý và broadcast kết quả
        if (hasAIMention) {
          const question = aiMatch[1].trim();
          logger.info(`[Socket] @AI được mention trong workspace ${workspaceId}, câu hỏi: "${question}"`);

          // Emit sự kiện "AI đang xử lý" để Frontend hiển thị typing indicator
          io.to(roomName).emit("workspace_ai_typing", { workspaceId });

          const aiResult = await groupChatService.handleAIMention(workspaceId, question);

          // Lưu AI response vào DB
          const aiMessage = await groupChatService.saveAIResponse(
            workspaceId,
            aiResult.content,
            aiResult.sources
          );

          // Broadcast AI response đến tất cả thành viên trong room
          io.to(roomName).emit("workspace_new_message", {
            message: {
              ...aiMessage.toObject(),
              senderId: null, // AI không có userId
              senderName: "SmartDoc AI 🤖",
            },
            workspaceId,
          });

          logger.info(`[Socket] AI đã trả lời trong workspace ${workspaceId}`);
        }
      } catch (error) {
        logger.error(`[Socket] Lỗi khi gửi tin nhắn workspace:`, error);
        socket.emit("error", { message: "Gửi tin nhắn thất bại, vui lòng thử lại" });
      }
    });

    // ── GROUP CHAT: Typing Indicator ──────────────────────────────────────────
    socket.on("workspace_typing", ({ workspaceId, isTyping }) => {
      if (!socket.userId || !workspaceId) return;

      const roomName = `workspace_${workspaceId}`;
      // Broadcast đến các thành viên KHÁC trong phòng (không gửi lại cho người đang gõ)
      socket.to(roomName).emit("workspace_user_typing", {
        userId: socket.userId,
        workspaceId,
        isTyping: !!isTyping,
      });
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info(`[Socket] Client ngắt kết nối: ${socket.id} | userId: ${socket.userId || "N/A"}`);

      // Thông báo cho workspace room nếu user đang trong phòng
      if (socket.currentWorkspaceRoom) {
        socket.to(socket.currentWorkspaceRoom).emit("workspace_user_typing", {
          userId: socket.userId,
          isTyping: false,
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
};

/**
 * Gửi event đến room cá nhân của user (Dùng cho document progress)
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    const roomName = userId.toString();
    logger.info(`[Socket] Đang emit ${event} đến room: ${roomName}`);
    io.to(roomName).emit(event, data);
    logger.info(`[Socket] Đã emit ${event} thành công`);
  } else {
    logger.warn(`[Socket] Không thể emit ${event} vì io chưa được khởi tạo`);
  }
};

/**
 * Gửi event đến toàn bộ phòng chat của Workspace
 */
export const emitToWorkspace = (workspaceId, event, data) => {
  if (io) {
    const roomName = `workspace_${workspaceId}`;
    io.to(roomName).emit(event, data);
    logger.info(`[Socket] Đã emit ${event} đến workspace room: ${roomName}`);
  } else {
    logger.warn(`[Socket] Không thể emit ${event} vì io chưa được khởi tạo`);
  }
};
