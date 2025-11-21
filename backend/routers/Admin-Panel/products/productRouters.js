const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  deleteProductPermanently,
  searchProducts,
} = require("../../../controllers/Admin-Panel/Products/productController");

// ایجاد محصول
router.post("/", authTokenMid, adminOnlyMid, createProduct);

// لیست محصولات
router.get("/", authTokenMid, adminOnlyMid, getAllProducts);

// جستجوی محصولات
router.get("/search", authTokenMid, adminOnlyMid, searchProducts);

// دریافت یک محصول (بر اساس id)
router.get("/:id", authTokenMid, adminOnlyMid, getProductById);

// بروزرسانی محصول
router.put("/:id", authTokenMid, adminOnlyMid, updateProduct);

// آرشیو (soft delete) محصول
router.delete("/:id", authTokenMid, adminOnlyMid, archiveProduct);

// حذف دائمی از دیتابیس
router.delete("/:id/hard", authTokenMid, adminOnlyMid, deleteProductPermanently);

module.exports = router;
