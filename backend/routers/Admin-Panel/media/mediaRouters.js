const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  presignPut,
  commitMedia,
  listMedia,
  listBucketMedia,
  deleteMediaByKey,
  deleteMediaById,
} = require("../../../controllers/Admin-Panel/Media/mediaController");

// 0) List media assets (from DB)
router.get("/", authTokenMid, adminOnlyMid, listMedia);

// 0-b) List bucket objects directly (optional)
router.get("/bucket", authTokenMid, adminOnlyMid, listBucketMedia);

// 1) Presigned PUT URL (recommended)
router.post("/presign", authTokenMid, adminOnlyMid, presignPut);

// 2) Commit metadata after successful direct upload
router.post("/commit", authTokenMid, adminOnlyMid, commitMedia);

// 3) Delete media (by key or by id)
router.delete("/", authTokenMid, adminOnlyMid, deleteMediaByKey);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteMediaById);

module.exports = router;
