//? 🔵 Required Modules
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

//? 🔵 Environment Configuration
require("dotenv").config();

//* 🟢 Express App
const app = express();

//* 🟢 Global Middlewares
app.use(loggerMiddleware);
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);


//* 🟢 Static Files
if (String(process.env.SERVE_LOCAL_UPLOADS || "").toLowerCase() === "true") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

//* 🟢 Request Pipeline
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || "1mb" }));
app.use(sanitizeMid);
app.use(cookieParser());
app.use("/api", apiLimiter, router);
app.use(errorHandler);

//* 🟢 Server Bootstrap
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
