import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";
import logger from "../utils/logger.js";

// Khởi tạo hàng đợi 'document-processing'
const documentQueue = new Queue("document-processing", {
  connection: redisConnection,
});

export const addDocumentJob = async (docId) => {
  try {
    const job = await documentQueue.add(
      "process-embeddings",
      { docId },
      {
        attempts: 3, // Thử lại tối đa 3 lần nếu lỗi
        backoff: {
          type: "exponential",
          delay: 5000, // Chờ 5s trước khi thử lại lần đầu
        },
        removeOnComplete: true, // Xóa job khi hoàn thành thành công
        removeOnFail: false, // Giữ lại để debug nếu lỗi
      },
    );
    logger.info(`[Queue] Đã thêm job xử lý tài liệu: ${docId} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    logger.error(`[Queue] Lỗi khi thêm job cho tài liệu ${docId}:`, error);
    throw error;
  }
};

export default documentQueue;
