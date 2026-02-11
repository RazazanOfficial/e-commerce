const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");

const {
  createTagCatalog,
  getAllTagCatalogs,
  suggestTags,
  getTagCatalogById,
  updateTagCatalog,
  toggleTagCatalog,
  deleteTagCatalog,
} = require("../../../controllers/Admin-Panel/Products/tagCatalogController");

router.post("/", authTokenMid, adminOnlyMid, createTagCatalog);
router.get("/", authTokenMid, adminOnlyMid, getAllTagCatalogs);
router.get("/suggest", authTokenMid, adminOnlyMid, suggestTags);
router.get("/:id", authTokenMid, adminOnlyMid, getTagCatalogById);
router.put("/:id", authTokenMid, adminOnlyMid, updateTagCatalog);
router.patch("/:id/toggle", authTokenMid, adminOnlyMid, toggleTagCatalog);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteTagCatalog);

module.exports = router;