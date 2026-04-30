import Redis from "ioredis";
import logger from "../utils/logger.js";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
};

const redisConnection = new Redis(redisConfig);

redisConnection.on("connect", () => {
  logger.info("✅ Redis connected successfully");
});

redisConnection.on("error", (err) => {
  logger.error("❌ Redis connection error:", err);
});

export default redisConnection;
