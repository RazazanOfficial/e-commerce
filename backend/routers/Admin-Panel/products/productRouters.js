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
  restoreProduct,
} = require("../../../controllers/Admin-Panel/Products/productController");


router.post("/", authTokenMid, adminOnlyMid, createProduct);


router.get("/", authTokenMid, adminOnlyMid, getAllProducts);


router.get("/search", authTokenMid, adminOnlyMid, searchProducts);


router.get("/:id", authTokenMid, adminOnlyMid, getProductById);


router.put("/:id", authTokenMid, adminOnlyMid, updateProduct);


router.delete("/:id", authTokenMid, adminOnlyMid, archiveProduct);


router.delete("/:id/hard", authTokenMid, adminOnlyMid, deleteProductPermanently);


router.patch("/:id/restore", authTokenMid, adminOnlyMid, restoreProduct);


module.exports = router;
