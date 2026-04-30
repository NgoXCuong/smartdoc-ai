import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import documentService from "../services/document.service.js";
import logger from "../utils/logger.js";

const documentWorker = new Worker(
  "document-processing",
  async (job) => {
    const { docId } = job.data;
    logger.info(`[Worker] Đang xử lý tài liệu: ${docId} (Job ID: ${job.id})`);
    
    try {
      await documentService.processEmbeddings(docId);
      logger.info(`[Worker] Đã hoàn thành xử lý tài liệu: ${docId}`);
    } catch (error) {
      logger.error(`[Worker] Lỗi khi xử lý tài liệu ${docId}:`, error);
      throw error; // Ném lỗi để BullMQ thực hiện retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Xử lý tối đa 2 tài liệu cùng lúc
  },
);

documentWorker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job.id} thất bại sau các lần thử lại:`, err);
});

export default documentWorker;
