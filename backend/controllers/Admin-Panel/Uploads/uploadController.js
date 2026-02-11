const path = require("path");

/**
 * Build an absolute URL for a given pathname.
 * - In dev, req.get('host') is reliable.
 * - In production behind reverse proxy, set PUBLIC_BASE_URL.
 */
function buildPublicUrl(req, pathname) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

// POST /api/admin/uploads/images
// multipart/form-data field: images (array) OR image (single)
exports.uploadImages = async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];

  if (!files.length) {
    return res.status(400).json({
      success: false,
      error: true,
      message: "هیچ فایلی ارسال نشده است",
    });
  }

  const payload = files.map((f) => {
    // Ensure path is normalized to web format
    const relative = `/uploads/products/${path.basename(f.filename)}`;
    return {
      url: buildPublicUrl(req, relative),
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
    };
  });

  return res.status(201).json({
    success: true,
    message: "آپلود با موفقیت انجام شد",
    files: payload,
  });
};
