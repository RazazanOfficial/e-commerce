const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const searchUsersController = require("../../../controllers/Admin-Panel/AllUsers/searchUsersController");

router.get(
  "/",
  authTokenMid,
  adminOnlyMid,
  searchUsersController
);

module.exports = router;
