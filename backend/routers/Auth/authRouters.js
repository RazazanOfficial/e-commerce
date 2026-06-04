//? 🔵 Required Modules
const express = require("express");
const router = express.Router();

const {
  requestRegisterCodeController,
  verifyRegisterCodeController,
} = require("../../controllers/Auth/registerController");
const loginController = require("../../controllers/Auth/loginController");
const authTokenMid = require("../../middlewares/authTokenMid");
const userDetailsController = require("../../controllers/Auth/userDetailsController");
const logoutController = require("../../controllers/Auth/logoutController");

//* 🟢 Auth Routes
router.post("/register", requestRegisterCodeController);
router.post("/register/request-code", requestRegisterCodeController);
router.post("/register/verify-code", verifyRegisterCodeController);
router.post("/login", loginController);
router.get("/user-details", authTokenMid, userDetailsController);
router.get("/logout", logoutController);

//? 🔵 Export Router
module.exports = router;
