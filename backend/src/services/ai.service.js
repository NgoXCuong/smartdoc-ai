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
      logger.info(`[AI] Raw response from Gemini: ${content}`);
      let cleanContent = content;
      if (typeof content === 'string') {
        cleanContent = content.replace(/```json\n?|```/g, "").trim();
      }

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ApiError(500, "AI không trả về JSON hợp lệ");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error("Lỗi khi gọi Gemini AI để tạo Metadata:", error);
      return { summary: "Không thể tạo tóm tắt vào lúc này.", questions: [] };
    }
  },

  /**
   * Trích xuất dữ liệu có cấu trúc từ văn bản
   */
  extractStructuredData: async (text, keys) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is missing in environment variables");
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        maxOutputTokens: 2000,
        temperature: 0.1, // Thấp để tăng độ chính xác của trích xuất
      });

      // Rút trích khoảng 20,000 ký tự đầu tiên
      const sampleText = text.substring(0, 20000);
      const keysList = keys.map(k => `- ${k}`).join("\n");

      const prompt = `
        Bạn là một chuyên gia trích xuất dữ liệu. Hãy đọc kỹ văn bản dưới đây:
        ---
        ${sampleText}
        ---
        Dựa vào văn bản trên, hãy trích xuất thông tin cho các trường sau:
        ${keysList}

        Trả về KẾT QUẢ DUY NHẤT LÀ MỘT OBJECT JSON, với các key là tên các trường yêu cầu, và value là giá trị trích xuất được.
        Nếu không tìm thấy thông tin cho một trường, hãy để value là null.
        KHÔNG ĐƯỢC GIẢI THÍCH THÊM. CHỈ TRẢ VỀ JSON.
      `;

      const response = await model.invoke(prompt);
      let content = response.content;
      logger.info(`[AI Extraction] Raw response: ${content}`);
      
      if (typeof content === 'string') {
        content = content.replace(/```json\n?|```/g, "").trim();
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ApiError(500, "AI không trả về JSON hợp lệ khi trích xuất");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error("Lỗi khi gọi Gemini AI để trích xuất dữ liệu:", error);
      throw new ApiError(500, "Không thể trích xuất dữ liệu lúc này");
    }
  }
};

export default aiService;
