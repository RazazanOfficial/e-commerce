const MediaAsset = require("../../../models/mediaAssetModel");
const {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  headObject,
} = require("../../../utils/cloudSpace");

// Allowed MIME types for direct upload
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
  const mt = mimeType.trim().toLowerCase();
  if (!allowedMime.has(mt)) {
    const err = new Error(`Unsupported mimeType: ${mimeType}`);
    err.statusCode = 400;
    throw err;
  }
  return mt;
}

function inferKind(mimeType) {
  const mt = String(mimeType || "").toLowerCase();
  if (mt === "image/gif") return "gif";
  if (mt.startsWith("image/")) return "image";
  if (mt.startsWith("video/")) return "video";
  return "other";
}

function assertKey(key) {
  if (!key || typeof key !== "string" || !key.trim()) {
    const err = new Error("key is required");
    err.statusCode = 400;
    throw err;
  }

  const cleaned = key.trim().replace(/^\/+/, "");
  if (!cleaned) {
    const err = new Error("key is invalid");
    err.statusCode = 400;
    throw err;
  }

  // Basic hardening against path tricks
  if (cleaned.includes("..") || cleaned.includes("\\") || cleaned.includes("%2e")) {
    const err = new Error("key is invalid");
    err.statusCode = 400;
    throw err;
  }

  // Enforce prefix if configured
  const prefix = String(process.env.CLOUD_SPACE_KEY_PREFIX || "").replace(/^\/+|\/+$/g, "");
  if (prefix && !cleaned.startsWith(prefix + "/")) {
    const err = new Error("key خارج از مسیر مجاز است");
    err.statusCode = 400;
    throw err;
  }

  // Enforce that key shape looks like our generated keys
  const base = cleaned.split("/").pop() || "";
  const okShape = /^\d{13}-[0-9a-f]{8}\.[a-z0-9]{2,5}$/i.test(base);
  if (!okShape) {
    const err = new Error("key نامعتبر است");
    err.statusCode = 400;
    throw err;
  }

  return cleaned;
}

/**
 * 1) Presign (recommended for production)
 * POST /api/admin/media/presign
 * body: { fileName?, mimeType, expiresInSec? }
 *
 * NOTE:
 * - We generate the key on server and never trust client extension.
 * - Client uploads DIRECTLY to ParsPack using PUT (no VPS bandwidth).
 */
const presignPut = async (req, res, next) => {
  try {
    const { mimeType, expiresInSec } = req.body || {};
    const mt = assertMime(mimeType);

    // Clamp expiry to sane bounds to reduce abuse window
    const expRaw = Number(expiresInSec);
    const exp = Number.isFinite(expRaw) ? Math.max(60, Math.min(3600, expRaw)) : 300;

    const key = generateObjectKey({
      mimeType: mt,
      prefix: process.env.CLOUD_SPACE_KEY_PREFIX || "",
    });

    const cacheControl = "public, max-age=31536000, immutable";

    const url = await createPresignedPut({
      key,
      mimeType: mt,
      expiresInSec: exp,
      cacheControl,
      // IMPORTANT: do NOT sign content-type by default (prevents mismatch in tools)
      signContentType: false,
    });

    // Headers client SHOULD send
    const headers = {
      "Content-Type": mt,
      "Cache-Control": cacheControl,
    };
    if (process.env.CLOUD_SPACE_OBJECT_ACL) {
      headers["x-amz-acl"] = process.env.CLOUD_SPACE_OBJECT_ACL;
    }

    return res.status(200).json({
      message: "OK",
      key,
      mimeType: mt,
      publicUrl: buildPublicUrl(key),
      upload: {
        method: "PUT",
        url,
        headers,
      },
      expiresInSec: exp,
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * 1-b) Commit metadata after successful direct PUT upload
 * POST /api/admin/media/commit
 * body: { key }
 *
 * Security:
 * - We verify the object exists on cloud (HEAD) and store trusted metadata.
 * - Client-provided mimeType/size are optional hints; the server trusts HEAD result.
 */
const commitMedia = async (req, res, next) => {
  try {
    const { key, originalName, kind } = req.body || {};
    const cleanedKey = assertKey(key);

    // Verify object exists & get trusted metadata
    const meta = await headObject({ key: cleanedKey });

    const ct = meta?.ContentType ? String(meta.ContentType).toLowerCase() : "";
    const trustedMime = ct && allowedMime.has(ct) ? ct : undefined;
    if (!trustedMime) {
      const err = new Error("نوع فایل روی فضای ابری مجاز نیست یا Content-Type تنظیم نشده است");
      err.statusCode = 400;
      throw err;
    }

    const trustedSize =
      typeof meta?.ContentLength === "number" ? meta.ContentLength : undefined;

    const doc = await MediaAsset.findOneAndUpdate(
      { key: cleanedKey },
      {
        $set: {
          key: cleanedKey,
          mimeType: trustedMime,
          size: trustedSize,
          originalName: originalName ? String(originalName).trim() : undefined,
          kind: kind ? String(kind).trim() : inferKind(trustedMime),
          // uploadedBy: req.user?.id, // optional
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        ...doc.toJSON(),
        publicUrl: buildPublicUrl(cleanedKey),
      },
    });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  presignPut,
  commitMedia,
};
