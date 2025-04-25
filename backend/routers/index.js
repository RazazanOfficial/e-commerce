const express = require("express");
const registerController = require("../controllers/registerController");
const loginController = require("../controllers/loginController");
const userDetailsController = require("../controllers/userDetailsController");
const logoutController = require("../controllers/logoutController");
const adminOnlyMid = require("../middlewares/adminOnlyMid");
const authTokenMid = require("../middlewares/authTokenMid");
const allUsersController = require("../controllers/allUsersController");
const searchUsersController = require("../controllers/searchUsersController");
const {
  getSingleUserController,
  updateUserController,
  deleteUserController,
} = require("../controllers/userBtnActionsController");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/user-details", authTokenMid, userDetailsController);
router.get("/logout", logoutController);

// !Panel Admin Routes
router.get("/admin/all-users", authTokenMid, adminOnlyMid, allUsersController);
router.get("/admin/search-users", authTokenMid, adminOnlyMid, searchUsersController);
router.get("/admin/user/:id", authTokenMid, adminOnlyMid, getSingleUserController);
router.put("/admin/user/:id", authTokenMid, adminOnlyMid, updateUserController);
router.delete("/admin/user/:id", authTokenMid, adminOnlyMid, deleteUserController);

module.exports = router;
