const logger = require("../utils/logger");

const sensitiveKeys = ["authorization", "cookie", "password"];

const redact = (obj) => {
  if (!obj) return obj;
  const clone = { ...obj };
  for (const key of sensitiveKeys) {
    if (clone[key]) clone[key] = "***REDACTED***";
  }
  return clone;
};

const requestLogger = (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",").shift() ||
    req.socket?.remoteAddress;

  const logMessage = {
    method: req.method,
    url: req.originalUrl,
    ip,
    userAgent: req.headers["user-agent"],
    headers: redact(req.headers),
    query: req.query,
    body: redact(req.body),
  };

  logger.info(JSON.stringify(logMessage, null, 2));

  next();
};

module.exports = requestLogger;
