const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  presignPut,
  commitMedia,
} = require("../../../controllers/Admin-Panel/Media/mediaController");

// 1) Presigned PUT URL (recommended)
router.post("/presign", authTokenMid, adminOnlyMid, presignPut);

// 2) Commit metadata after successful direct upload
router.post("/commit", authTokenMid, adminOnlyMid, commitMedia);

module.exports = router;
