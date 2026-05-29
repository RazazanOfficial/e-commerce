const express = require("express");
const router = express.Router();
const {
  getPublicProducts,
  getPublicProductBySlug,
} = require("../../controllers/Storefront/productController");

router.get("/", getPublicProducts);
router.get("/:slug", getPublicProductBySlug);

module.exports = router;
