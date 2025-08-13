const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  getSingleUserController,
  updateUserController,
  deleteUserController,
} = require("../../../controllers/Admin-Panel/AllUsers/userBtnActionsController");


router.get(
  "/:id",
  authTokenMid,
  adminOnlyMid,
  getSingleUserController
);
router.put("/:id", authTokenMid, adminOnlyMid, updateUserController);
router.delete(
  "/:id",
  authTokenMid,
  adminOnlyMid,
  deleteUserController
);

module.exports = router;
