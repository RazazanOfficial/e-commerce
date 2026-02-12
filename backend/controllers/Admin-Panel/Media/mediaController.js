const multer = require("multer");
const {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  uploadBuffer,
} = require("../../../utils/cloudSpace");

// In-memory upload (no file saved on VPS disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file (adjust later)
  },
});

const allowedMime = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function assertMime(mimeType) {
  if (!mimeType || typeof mimeType !== "string") {
    const err = new Error("mimeType is required");
    err.statusCode = 400;
    throw err;
  }
  if (!allowedMime.has(mimeType)) {
    const err = new Error(`Unsupported mimeType: ${mimeType}`);
    err.statusCode = 400;
    throw err;
  }
}

/**
 * 1) Presign (recommended for production)
 * POST /api/admin/media/presign
 * body: { fileName, mimeType, expiresInSec? }
 */
const presignPut = async (req, res, next) => {
  try {
    const { fileName, mimeType, expiresInSec } = req.body || {};
    assertMime(mimeType);

    const key = generateObjectKey({ fileName, mimeType });
    const url = await createPresignedPut({
      key,
      mimeType,
      expiresInSec: Number(expiresInSec) > 0 ? Number(expiresInSec) : 300,
    });

    return res.status(200).json({
      message: "OK",
      key,
      mimeType,
      publicUrl: buildPublicUrl(key),
      upload: {
        method: "PUT",
        url,
        headers: {
          "Content-Type": mimeType,
        },
      },
      expiresInSec: Number(expiresInSec) > 0 ? Number(expiresInSec) : 300,
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * 2) Server-side upload (one-step; good for Postman/dev)
 * POST /api/admin/media/upload
 * multipart/form-data: file
 * NOTE: file does NOT persist on VPS disk, but bandwidth passes through VPS.
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("file is required");
      err.statusCode = 400;
      throw err;
    }

    const mimeType = req.file.mimetype;
    assertMime(mimeType);

    const key = generateObjectKey({ fileName: req.file.originalname, mimeType });

    await uploadBuffer({
      key,
      buffer: req.file.buffer,
      mimeType,
      // cache for a long time (safe because name is unique)
      cacheControl: "public, max-age=31536000, immutable",
    });

    return res.status(201).json({
      message: "Uploaded",
      key,
      mimeType,
      size: req.file.size,
      originalName: req.file.originalname,
      publicUrl: buildPublicUrl(key),
    });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  presignPut,
  upload,
  uploadSingle,
};
