//? 🔵 Product Controller Modules
const { createProduct } = require("./product/createProductController");
const { getAllProducts, getProductById, searchProducts } = require("./product/queryProductController");
const { updateProduct } = require("./product/updateProductController");
const { archiveProduct, deleteProductPermanently, restoreProduct } = require("./product/productStatusController");

//? 🔵 Export Product Controllers
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  deleteProductPermanently,
  searchProducts,
  restoreProduct,
};
