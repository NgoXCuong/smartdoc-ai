import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";

import helmet from "helmet";
import cors from "cors";

import connectDB from "./config/db.js";
import routes from "./routes/index.routes.js";
import { setupSwagger } from "./config/swagger.js";
import logger from "./utils/logger.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import "./workers/document.worker.js"; // Khởi động worker xử lý hàng đợi

import { createServer } from "http";
import { initSocket } from "./config/socket.js";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", routes);

// Error Handling (Must be after routes)
app.use(errorHandler);

initSocket(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
});
