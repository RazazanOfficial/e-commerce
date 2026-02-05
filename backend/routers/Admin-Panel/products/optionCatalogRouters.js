const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");

const {
  createOptionCatalog,
  getAllOptionCatalogs,
  getOptionCatalogById,
  updateOptionCatalog,
  deleteOptionCatalog,
  toggleOptionCatalogActive,
} = require("../../../controllers/Admin-Panel/Products/optionCatalogController");

router.post("/", authTokenMid, adminOnlyMid, createOptionCatalog);

router.get("/", authTokenMid, adminOnlyMid, getAllOptionCatalogs);

router.get("/:id", authTokenMid, adminOnlyMid, getOptionCatalogById);

router.put("/:id", authTokenMid, adminOnlyMid, updateOptionCatalog);

router.patch(
  "/:id/toggle",
  authTokenMid,
  adminOnlyMid,
  toggleOptionCatalogActive
);

router.delete("/:id", authTokenMid, adminOnlyMid, deleteOptionCatalog);

module.exports = router;
