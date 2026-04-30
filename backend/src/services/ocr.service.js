import Tesseract from 'tesseract.js';
import logger from "../utils/logger.js";

const ocrService = {
  /**
   * Trích xuất văn bản từ Buffer hình ảnh (Buffer của file PNG, JPG, v.v.)
   */
  extractText: async (imageBuffer) => {
    try {
      logger.info("Đang bắt đầu quá trình OCR cho hình ảnh...");
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'vie+eng', // Hỗ trợ nhận diện cả Tiếng Việt và Tiếng Anh
        { 
          // logger: m => console.log(m) 
        }
      );
      logger.info(`Hoàn tất OCR. Trích xuất được ${text.length} ký tự.`);
      return text.trim();
    } catch (error) {
      logger.error("Lỗi OCR:", error);
      throw new Error("Không thể thực hiện OCR trên tài liệu này");
    }
  },

  /**
   * Xử lý OCR cho PDF đa trang (Scanned PDF)
   */
  handlePDFOCR: async (pdfBuffer) => {
    try {
      logger.info("Đang bắt đầu chuyển đổi PDF sang hình ảnh để OCR...");
      const { pdfToPng } = await import('pdf-to-png-converter');
      
      // Chuyển đổi PDF sang mảng các hình ảnh (PNG)
      const outputImages = await pdfToPng(pdfBuffer, {
        viewportScale: 2.0, // Tăng độ phân giải để OCR chính xác hơn
      });

      logger.info(`Đã chuyển đổi thành công ${outputImages.length} trang. Đang tiến hành OCR từng trang...`);

      let fullText = "";
      const pageResults = [];

      for (let i = 0; i < outputImages.length; i++) {
        logger.info(`Đang OCR trang ${i + 1}/${outputImages.length}...`);
        // outputImages[i].content là Buffer của file PNG
        const text = await ocrService.extractText(outputImages[i].content);
        pageResults.push({
          pageNumber: i + 1,
          content: text
        });
        fullText += `--- Trang ${i + 1} ---\n${text}\n\n`;
      }

      return { fullText, pageResults };
    } catch (error) {
      logger.error("Lỗi OCR PDF:", error);
      throw new Error("Không thể thực hiện OCR trên file PDF này");
    }
  }
};

export default ocrService;
