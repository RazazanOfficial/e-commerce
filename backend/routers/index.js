const express = require("express");
const registerController = require("../controllers/registerController");
const loginController = require("../controllers/loginController");
const authTokenMid = require("../middlewares/authTokenMid");
const userDetailsController = require("../controllers/userDetailsController");
const logoutController = require("../controllers/logoutController");
const adminOnlyMid = require("../middlewares/adminOnlyMid");
const allUsersController = require("../controllers/allUsersController");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/user-details", authTokenMid, userDetailsController);
router.get("/logout", logoutController);

// !Panel Admin Routes
router.get("/all-users", authTokenMid, adminOnlyMid, allUsersController);

module.exports = router;
