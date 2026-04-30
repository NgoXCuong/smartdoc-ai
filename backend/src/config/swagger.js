import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import logger from "../utils/logger.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SmartDoc AI API",
      version: "1.0.0",
      description: "API Documentation for SmartDoc AI Project",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development Server",
      },
    ],
  },

  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info(`📄 Swagger Docs đang chạy tại http://localhost:${process.env.PORT || 5000}/api-docs`);
};
