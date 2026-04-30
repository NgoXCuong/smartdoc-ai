import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

const aiService = {
  /**
   * Tạo tóm tắt và gợi ý câu hỏi từ văn bản thô sử dụng Gemini
   */
  generateMetadata: async (text) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing in environment variables");
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        maxOutputTokens: 1000,
        temperature: 0.7,
      });

      // Lấy 10,000 ký tự đầu tiên để tóm tắt (tránh vượt giới hạn token)
      const sampleText = text.substring(0, 10000);

      const prompt = `
        Bạn là một chuyên gia phân tích tài liệu. Dựa vào nội dung tài liệu sau đây:
        ---
        ${sampleText}
        ---
        Hãy thực hiện (trả về JSON theo cấu trúc yêu cầu):
        {
          "summary": "Tóm tắt nội dung chính trong khoảng 3-5 câu (Tiếng Việt).",
          "questions": ["Đề xuất 3-5 câu hỏi quan trọng nhất dựa trên tài liệu."]
        }
      `;

      const response = await model.invoke(prompt);
      const content = response.content;

      // Trích xuất JSON từ phản hồi (đề phòng AI trả về thêm text giải thích)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ApiError(500, "AI không trả về JSON hợp lệ");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error("Lỗi khi gọi Gemini AI để tạo Metadata:", error);
      return { summary: "Không thể tạo tóm tắt vào lúc này.", questions: [] };
    }
  }
};

export default aiService;
