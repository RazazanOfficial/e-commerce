const express = require("express");
const registerController = require("../controllers/registerController");
const loginController = require("../controllers/loginController");
const router = express.Router();

router.post("/register", registerController);
router.get("/login", loginController);
module.exports = router;
