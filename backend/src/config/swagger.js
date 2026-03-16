import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import logger from "../utils/logger.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Watch Store API",
      version: "1.0.0",
      description: "Tài liệu hướng dẫn sử dụng API cho dự án Watch Store",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
    ],
  },

  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info("📄 Swagger Docs đang chạy tại http://localhost:3000/api-docs");
};
