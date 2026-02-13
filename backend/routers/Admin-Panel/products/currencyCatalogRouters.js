const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");

const {
  createCurrencyCatalog,
  getAllCurrencyCatalogs,
  getCurrencyCatalogById,
  updateCurrencyCatalog,
  toggleCurrencyCatalog,
  deleteCurrencyCatalog,
} = require("../../../controllers/Admin-Panel/Products/currencyCatalogController");

router.post("/", authTokenMid, adminOnlyMid, createCurrencyCatalog);
router.get("/", authTokenMid, adminOnlyMid, getAllCurrencyCatalogs);
router.get("/:id", authTokenMid, adminOnlyMid, getCurrencyCatalogById);
router.put("/:id", authTokenMid, adminOnlyMid, updateCurrencyCatalog);
router.patch("/:id/toggle", authTokenMid, adminOnlyMid, toggleCurrencyCatalog);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteCurrencyCatalog);

module.exports = router;
