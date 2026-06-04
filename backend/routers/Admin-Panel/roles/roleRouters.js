//? 🔵 Required Modules
const express = require("express");
const router = express.Router();
const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  createRoleController,
  deleteRoleController,
  listRolesController,
  updateRoleController,
} = require("../../../controllers/Admin-Panel/Roles/roleController");

//* 🟢 Role Routes
router.get("/", authTokenMid, adminOnlyMid, listRolesController);
router.post("/", authTokenMid, adminOnlyMid, createRoleController);
router.put("/:id", authTokenMid, adminOnlyMid, updateRoleController);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteRoleController);

//? 🔵 Export Router
module.exports = router;
