const express = require("express");
const router = express.Router();

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const {
  presignPut,
  upload,
  uploadSingle,
} = require("../../../controllers/Admin-Panel/Media/mediaController");

// 1) Presigned PUT URL (recommended)
router.post("/presign", authTokenMid, adminOnlyMid, presignPut);

// 2) One-step upload (multipart) - good for Postman/dev
router.post(
  "/upload",
  authTokenMid,
  adminOnlyMid,
  upload.single("file"),
  uploadSingle
);

module.exports = router;
