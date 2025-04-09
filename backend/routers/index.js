const express = require("express");
const registerController = require("../controllers/registerController");
const loginController = require("../controllers/loginController");
const authTokenMid = require("../middlewares/authTokenMid");
const userDetailsController = require("../controllers/userDetailsController");
const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/user-details", authTokenMid, userDetailsController);
module.exports = router;
