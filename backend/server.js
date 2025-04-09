const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const router = require("./routers");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

const PORT = 8080 || process.env.PORT;

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
