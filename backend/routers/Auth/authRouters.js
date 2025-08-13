const express = require("express");
const router = express.Router();

const registerController = require("../../controllers/Auth/registerController");
const loginController = require("../../controllers/Auth/loginController");
const authTokenMid = require("../../middlewares/authTokenMid");
const userDetailsController = require("../../controllers/Auth/userDetailsController");
const logoutController = require("../../controllers/Auth/logoutController");

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/user-details", authTokenMid, userDetailsController);
router.get("/logout", logoutController);

module.exports = router;
