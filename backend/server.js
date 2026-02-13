const express = require("express");
const cors = require("cors");
const path = require("path");
const router = require("./routers");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const sanitizeMid = require("./middlewares/sanitizeMid");
const apiLimiter = require("./middlewares/rateLimitMid");
const errorHandler = require("./middlewares/errorHandlerMid");
const loggerMiddleware = require("./middlewares/loggerMid");

require("dotenv").config();

const app = express();

app.use(loggerMiddleware);
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Serve local uploaded files ONLY if explicitly enabled (disabled by default).
if (String(process.env.SERVE_LOCAL_UPLOADS || "").toLowerCase() === "true") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}


// Serve uploaded files

app.use(express.json());
app.use(sanitizeMid);
app.use(cookieParser());
app.use("/api", apiLimiter, router);
app.use(errorHandler);
const PORT = process.env.PORT || 9999;

const startServer = async () => {
  const dbStatus = await connectDB();
  app.listen(PORT, () => {
    console.table({
      "Server Status": "Running",
      Port: PORT.toString(),
      ...dbStatus,
    });
  });
};

startServer();
