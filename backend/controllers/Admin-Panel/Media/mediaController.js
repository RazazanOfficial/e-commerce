const MediaAsset = require("../../../models/mediaAssetModel");
const { Product } = require("../../../models/productModel");
const {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  headObject,
  deleteObject,
  listObjects,
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

function assertKeyLoose(key) {
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

  return cleaned;
}

function assertKeyStrict(key) {
  const cleaned = assertKeyLoose(key);

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

    // NOTE: We intentionally do NOT include Cache-Control in the presigned URL signature
    // (some clients/proxies/tooling can subtly alter headers/encoding and break signed requests).
    // Client may still send Cache-Control header; it won't be part of the signature.
    const url = await createPresignedPut({
      key,
      mimeType: mt,
      expiresInSec: exp,
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
    const cleanedKey = assertKeyStrict(key);

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


/**
 * List uploaded media (admin)
 * GET /api/admin/media
 * query: page, limit, q, kind
 */
const listMedia = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, q, kind } = req.query || {};

    const pNum = Math.max(1, Number(page) || 1);
    const lNum = Math.max(1, Math.min(200, Number(limit) || 30));

    const filter = {};
    if (kind && typeof kind === "string" && kind.trim()) {
      filter.kind = kind.trim();
    }

    if (q && String(q).trim()) {
      const qq = String(q).trim();
      filter.$or = [
        { key: { $regex: qq, $options: "i" } },
        { originalName: { $regex: qq, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip((pNum - 1) * lNum)
        .limit(lNum)
        .lean(),
      MediaAsset.countDocuments(filter),
    ]);

    const shaped = items.map((it) => ({
      ...it,
      publicUrl: it?.key ? buildPublicUrl(it.key) : undefined,
    }));

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items: shaped,
        page: pNum,
        limit: lNum,
        total,
        totalPages: Math.ceil(total / lNum) || 1,
      },
    });
  } catch (e) {
    return next(e);
  }
};



/**
 * Delete a media asset (admin)
 * - Deletes object from cloud storage
 * - Deletes DB record (if exists)
 *
 * DELETE /api/admin/media?key=...
 * query: key (required), force (optional boolean)
 *
 * Notes:
 * - If the asset is referenced by any product, returns 409 unless force=true.
 * - If the DB record does not exist, we still attempt to delete the object from cloud (useful for orphan cleanup).
 */
const deleteMediaByKey = async (req, res, next) => {
  try {
    const keyInput = (req.query && req.query.key) || (req.body && req.body.key);
    const cleanedKey = assertKeyLoose(keyInput);

    const forceRaw = (req.query && req.query.force) || (req.body && req.body.force);
    const force =
      forceRaw === true ||
      ["1", "true", "yes", "on"].includes(String(forceRaw || "").trim().toLowerCase());

    const publicUrl = buildPublicUrl(cleanedKey);

    // Guard against deleting media that is still used by products
    const inUseQuery = {
      $or: [
        { "media.key": cleanedKey },
        { "media.posterKey": cleanedKey },

        { "media.url": publicUrl },
        { "media.posterUrl": publicUrl },

        { "images.url": publicUrl },
        { "images.variants.thumb": publicUrl },
        { "images.variants.md": publicUrl },
        { "images.variants.lg": publicUrl },

        { "videos.url": publicUrl },
        { "videos.poster": publicUrl },

        { "variants.images.url": publicUrl },
        { "variants.images.variants.thumb": publicUrl },
        { "variants.images.variants.md": publicUrl },
        { "variants.images.variants.lg": publicUrl },
      ],
    };

    const usedCount = await Product.countDocuments(inUseQuery);

    if (usedCount > 0 && !force) {
      const samples = await Product.find(inUseQuery)
        .select({ _id: 1, title: 1, slug: 1, status: 1 })
        .limit(5)
        .lean();

      return res.status(409).json({
        success: false,
        error: true,
        message:
          "این فایل در محصولات استفاده شده است. ابتدا آن را از محصول/محصولات حذف کنید یا با force=true حذف اجباری انجام دهید.",
        code: "MEDIA_IN_USE",
        data: { usedCount, samples },
      });
    }

    // Delete from cloud (idempotent)
    const cloud = await deleteObject({ key: cleanedKey });

    // Delete DB record if exists
    const dbDoc = await MediaAsset.findOneAndDelete({ key: cleanedKey }).lean();

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        key: cleanedKey,
        publicUrl,
        deletedFromCloud: true,
        cloudNotFound: !!cloud?.notFound,
        deletedFromDb: !!dbDoc,
      },
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * Delete by Mongo _id (admin)
 * DELETE /api/admin/media/:id
 */
const deleteMediaById = async (req, res, next) => {
  try {
    const { id } = req.params || {};
    if (!id || typeof id !== "string") {
      const err = new Error("id is required");
      err.statusCode = 400;
      throw err;
    }

    const doc = await MediaAsset.findById(id).lean();
    if (!doc) {
      const err = new Error("فایل پیدا نشد");
      err.statusCode = 404;
      throw err;
    }

    // Delegate to delete-by-key logic (keeps in-use protection)
    req.query = { ...(req.query || {}), key: doc.key, force: req.query?.force };
    return deleteMediaByKey(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * List bucket objects directly (admin) — optional for gallery/maintenance
 * GET /api/admin/media/bucket
 * query: prefix?, continuationToken?, limit?, kind?
 *
 * kind filter is best-effort based on file extension (no HEAD calls).
 */
const listBucketMedia = async (req, res, next) => {
  try {
    const allowedPrefix = String(process.env.CLOUD_SPACE_KEY_PREFIX || "").replace(/^\/+|\/+$/g, "");
    const qPrefixRaw = req.query?.prefix ? String(req.query.prefix) : allowedPrefix;
    const qPrefix = qPrefixRaw ? String(qPrefixRaw).replace(/^\/+/, "") : "";

    if (allowedPrefix && qPrefix && !qPrefix.startsWith(allowedPrefix)) {
      const err = new Error("prefix خارج از مسیر مجاز است");
      err.statusCode = 400;
      throw err;
    }

    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, limitRaw)) : 200;

    const kind = req.query?.kind ? String(req.query.kind).trim().toLowerCase() : "";

    const extKind = (key) => {
      const base = String(key || "").toLowerCase();
      const ext = (base.split(".").pop() || "").trim();
      if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ext === "gif" ? "gif" : "image";
      if (["mp4", "webm", "mov", "qt"].includes(ext)) return "video";
      return "other";
    };

    const resp = await listObjects({
      prefix: qPrefix || undefined,
      continuationToken: req.query?.continuationToken,
      maxKeys: limit,
    });

    let items = Array.isArray(resp?.items) ? resp.items : [];
    if (kind) items = items.filter((it) => extKind(it.key) === kind);

    const shaped = items.map((it) => ({
      ...it,
      kind: extKind(it.key),
      publicUrl: it?.key ? buildPublicUrl(it.key) : undefined,
    }));

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        prefix: resp?.prefix || qPrefix || "",
        limit,
        isTruncated: !!resp?.isTruncated,
        nextContinuationToken: resp?.nextContinuationToken,
        items: shaped,
      },
    });
  } catch (e) {
    return next(e);
  }
};


module.exports = {
  presignPut,
  commitMedia,
  listMedia,
  deleteMediaByKey,
  deleteMediaById,
  listBucketMedia,
};
