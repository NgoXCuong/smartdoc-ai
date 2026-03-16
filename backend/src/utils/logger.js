import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleLogFormat = printf((info) => {
  const { level, message, timestamp, stack } = info;
  return `[${timestamp}] ${level} : ${stack || message}`;
});

const fileLogFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level.toUpperCase()} : ${stack || message}`;
});

const logger = winston.createLogger({
  level: "info",

  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    fileLogFormat,
  ),

  transports: [
    new winston.transports.Console({
      format: combine(
        errors({ stack: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        colorize(),
        consoleLogFormat,
      ),
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

export default logger;
