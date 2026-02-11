const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const authTokenMid = require("../../../middlewares/authTokenMid");
const adminOnlyMid = require("../../../middlewares/adminOnlyMid");
const { uploadImages } = require("../../../controllers/Admin-Panel/Uploads/uploadController");

// Ensure upload directory exists
const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "products");
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".bin";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  if (!file?.mimetype?.startsWith("image/")) {
    const err = new Error("فقط فایل تصویر قابل آپلود است");
    err.statusCode = 400;
    return cb(err, false);
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 6 * 1024 * 1024, // 6MB per file
    files: 10,
  },
});

// POST /api/admin/uploads/images
// - multipart/form-data
// - field: images (max 10) OR image (single)
router.post(
  "/images",
  authTokenMid,
  adminOnlyMid,
  (req, res, next) => {
    // Accept both single and multiple field names
    const handler = upload.any();
    handler(req, res, (err) => {
      if (err) {
        // Multer error normalization
        if (err.name === "MulterError") {
          err.statusCode = 400;
          if (err.code === "LIMIT_FILE_SIZE") err.message = "حجم فایل بیش از حد مجاز است";
          if (err.code === "LIMIT_FILE_COUNT") err.message = "تعداد فایل‌ها بیش از حد مجاز است";
        }
        return next(err);
      }

      // Normalize to req.files using the expected key
      // multer.any() produces req.files = [{ fieldname, ... }]
      // We'll keep them as-is; controller will read req.files.
      return next();
    });
  },
  uploadImages
);

module.exports = router;
