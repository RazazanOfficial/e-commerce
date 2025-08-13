const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const allUsersController = require("../../../controllers/Admin-Panel/AllUsers/allUsersController");


router.get("/", authTokenMid, adminOnlyMid, allUsersController);

module.exports = router;
