const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../../../controllers/Admin-Panel/Products/categoryController");

router.post("/", authTokenMid, adminOnlyMid, createCategory);
router.get("/", authTokenMid, adminOnlyMid, getAllCategories);
router.put("/:id", authTokenMid, adminOnlyMid, updateCategory);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteCategory);

module.exports = router;
