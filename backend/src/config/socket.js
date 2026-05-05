import { Server } from "socket.io";
import logger from "../utils/logger.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true // Đôi khi cần cho client cũ
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);

    socket.on("join", (userId) => {
      logger.info(`[Socket] User attempting to join: ${userId}`);
      if (userId) {
        const roomName = userId.toString();
        socket.join(roomName);
        logger.info(`[Socket] User ${userId} joined room: ${roomName}`);

        // Gửi xác nhận về cho client
        socket.emit("joined", { room: roomName });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) {
    const roomName = userId.toString();
    logger.info(`[Socket] Attempting to emit ${event} to room: ${roomName}`);
    io.to(roomName).emit(event, data);
    logger.info(`[Socket] Emitted ${event} successfully`);
  } else {
    logger.warn(`[Socket] Cannot emit ${event} because io is not initialized`);
  }
};
