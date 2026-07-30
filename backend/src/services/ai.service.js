import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

const aiService = {
  /**
   * Tạo tóm tắt và gợi ý câu hỏi từ văn bản thô sử dụng Gemini
   */
  generateMetadata: async (text) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY bị thiếu trong các biến môi trường");
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        maxOutputTokens: 2048,
        temperature: 0.2,
      });

      // Lấy 200,000 ký tự đầu tiên để tận dụng context cực lớn của Gemini Flash
      // Giúp tóm tắt bao quát toàn bộ tài liệu mà tốc độ vẫn cực kỳ nhanh so với Map-Reduce
      const sampleText = text.substring(0, 200000);

      const messages = [
        new SystemMessage(`Bạn là một chuyên gia phân tích tài liệu.
        Bạn BẮT BUỘC phải trả về một JSON hợp lệ (không kèm theo bất kỳ văn bản giải thích hay markdown \`\`\` nào). Cấu trúc bắt buộc:
        {
          "summary": "Tóm tắt nội dung chính trong khoảng 3-5 câu (Tiếng Việt).",
          "tags": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
          "questions": ["Câu hỏi 1?", "Câu hỏi 2?", "Câu hỏi 3?"]
        }`),
        new HumanMessage(`Dựa vào nội dung tài liệu sau đây, hãy thực hiện yêu cầu phân tích:\n\n---\n${sampleText}\n---`)
      ];

      const response = await model.invoke(messages);
      const content = response.content;
      logger.info(`[AI] Phản hồi thô từ Gemini đã nhận được (độ dài: ${content?.length || 0})`);
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
      return { summary: "Không thể tạo tóm tắt vào lúc này.", tags: [], questions: [] };
    }
  },

  /**
   * Trích xuất dữ liệu có cấu trúc từ văn bản
   */
  extractStructuredData: async (text, keys) => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY bị thiếu trong các biến môi trường");
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-flash-latest",
        maxOutputTokens: 2000,
        temperature: 0.1, // Thấp để tăng độ chính xác của trích xuất
      });

      // Tận dụng Context lớn của Gemini Flash (Lên đến 1 triệu tokens ~ hàng trăm ngàn ký tự)
      const sampleText = text.substring(0, 200000);
      const keysList = keys.map(k => `- ${k}`).join("\n");

      const messages = [
        new SystemMessage(`Bạn là một chuyên gia trích xuất dữ liệu.
        Dựa vào văn bản người dùng cung cấp, hãy trích xuất thông tin cho các trường sau:
        ${keysList}

        Trả về KẾT QUẢ DUY NHẤT LÀ MỘT OBJECT JSON, với các key là tên các trường yêu cầu, và value là giá trị trích xuất được.
        Nếu không tìm thấy thông tin cho một trường, hãy để value là null.
        KHÔNG ĐƯỢC GIẢI THÍCH THÊM. CHỈ TRẢ VỀ JSON hợp lệ.`),
        new HumanMessage(`Văn bản cần trích xuất:\n\n---\n${sampleText}\n---`)
      ];

      const response = await model.invoke(messages);
      let content = response.content;
      logger.info(`[AI Extraction] Phản hồi thô đã nhận được`);
      
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

