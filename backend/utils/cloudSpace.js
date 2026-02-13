const crypto = require("crypto");
const path = require("path");
const AWS = require("aws-sdk");

/**
 * ParsPack Cloud Storage is S3-compatible.
 * This helper wraps aws-sdk v2 S3 for:
 * - direct upload with Presigned PUT URL (recommended)
 * - reading object metadata (HEAD) to verify existence on commit
 */

function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`Missing env: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

function cleanBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function parseBoolEnv(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(raw).trim().toLowerCase());
}

function normalizeEndpointUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

function getS3Client() {
  const endpointRaw = mustEnv("CLOUD_SPACE_END_POINT_URL");
  const accessKeyId = mustEnv("CLOUD_SPACE_ACCESS_KEY");
  const secretAccessKey = mustEnv("CLOUD_SPACE_SECRET_KEY");

  const endpointUrl = normalizeEndpointUrl(endpointRaw);
  const endpoint = new AWS.Endpoint(endpointUrl);

  return new AWS.S3({
    endpoint,
    accessKeyId,
    secretAccessKey,
    // ParsPack examples often use us-west-2; keep configurable but stable default.
    region: process.env.CLOUD_SPACE_REGION || "us-west-2",
    signatureVersion: "v4",
    // ParsPack/MinIO style works best with path-style endpoint in most setups.
    s3ForcePathStyle: parseBoolEnv("CLOUD_SPACE_FORCE_PATH_STYLE", true),
  });
}

function encodeKeyPreservingSlashes(key) {
  return String(key || "")
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/**
 * Build public URL for an object key.
 * - If CLOUD_SPACE_PUBLIC_BASE_URL already points to bucket (subdomain or path), don't duplicate bucket.
 * - Keep "/" in keys (do not encode as %2F).
 */
function buildPublicUrl(key) {
  const base = cleanBaseUrl(mustEnv("CLOUD_SPACE_PUBLIC_BASE_URL"));
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const encodedKey = encodeKeyPreservingSlashes(key);

  try {
    const u = new URL(base);
    const hostHasBucket = u.hostname.toLowerCase().startsWith(`${bucket.toLowerCase()}.`);
    const pathHasBucket = u.pathname === `/${bucket}` || u.pathname.startsWith(`/${bucket}/`);

    if (hostHasBucket || pathHasBucket) {
      return `${base}/${encodedKey}`;
    }
    return `${base}/${bucket}/${encodedKey}`;
  } catch (_) {
    // If base is not a valid URL, fallback to simple join.
    return `${base}/${bucket}/${encodedKey}`;
  }
}

function extFromMime(mimeType) {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[String(mimeType || "").toLowerCase()] || "bin";
}

/**
 * Generate an object key controlled by server (do NOT trust client extension).
 */
function generateObjectKey({ mimeType, prefix = "" }) {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  const ext = extFromMime(mimeType);

  const safePrefix = String(prefix || "").replace(/^\/+|\/+$/g, "");
  const base = `${ts}-${rand}.${ext}`;
  return safePrefix ? `${safePrefix}/${base}` : base;
}

/**
 * Create Presigned PUT URL.
 * IMPORTANT: Avoid signing Content-Type by default to prevent signature mismatch
 * caused by small header variations from browsers/tools.
 */
function createPresignedPut({
  key,
  mimeType,
  expiresInSec = 300,
  cacheControl,
  signContentType = false,
}) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresInSec,
  };

  if (signContentType && mimeType) params.ContentType = mimeType;
  if (cacheControl) params.CacheControl = cacheControl;
  if (process.env.CLOUD_SPACE_OBJECT_ACL) params.ACL = process.env.CLOUD_SPACE_OBJECT_ACL;

  return new Promise((resolve, reject) => {
    s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

/**
 * Head object to verify it exists (used by /commit).
 */
async function headObject({ key }) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  try {
    const meta = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return meta;
  } catch (err) {
    // Normalize common "not found" cases
    const code = err?.code || err?.name;
    if (code === "NotFound" || code === "NoSuchKey" || err?.statusCode === 404) {
      const e = new Error("فایل روی فضای ابری یافت نشد (upload انجام نشده یا key اشتباه است)");
      e.statusCode = 400;
      throw e;
    }
    throw err;
  }
}

module.exports = {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  headObject,
};
