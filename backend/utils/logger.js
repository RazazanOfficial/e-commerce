const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

const transport = new transports.DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "10m",
  maxFiles: "30d",
});

const logger = createLogger({
  level: "silly",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // format.colorize(),
    format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new transports.Console(),
    transport,
  ],
});

module.exports = logger;