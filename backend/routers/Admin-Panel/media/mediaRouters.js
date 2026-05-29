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


router.get("/", authTokenMid, adminOnlyMid, listMedia);


router.get("/bucket", authTokenMid, adminOnlyMid, listBucketMedia);


router.post("/presign", authTokenMid, adminOnlyMid, presignPut);


router.post("/commit", authTokenMid, adminOnlyMid, commitMedia);


router.delete("/", authTokenMid, adminOnlyMid, deleteMediaByKey);
router.delete("/:id", authTokenMid, adminOnlyMid, deleteMediaById);

module.exports = router;
