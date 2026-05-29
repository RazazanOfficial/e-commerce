//? 🔵 Required Modules
const crypto = require("crypto");
const path = require("path");
const AWS = require("aws-sdk");


//* 🟢 Environment Utilities
function mustEnv(name) {
  const raw = process.env[name];
  const v = raw === undefined || raw === null ? "" : String(raw).trim();
  if (!v) {
    const err = new Error(`Missing env: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

//* 🟢 URL Utilities
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

//* 🟢 S3 Client
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

    region: process.env.CLOUD_SPACE_REGION || "us-west-2",
    signatureVersion: "v4",

    s3ForcePathStyle: parseBoolEnv("CLOUD_SPACE_FORCE_PATH_STYLE", true),
  });
}

function encodeKeyPreservingSlashes(key) {
  return String(key || "")
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}


//* 🟢 Public URL Builder
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

    return `${base}/${bucket}/${encodedKey}`;
  }
}

//* 🟢 Object Key Utilities
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


function generateObjectKey({ mimeType, prefix = "" }) {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  const ext = extFromMime(mimeType);

  const safePrefix = String(prefix || "").replace(/^\/+|\/+$/g, "");
  const base = `${ts}-${rand}.${ext}`;
  return safePrefix ? `${safePrefix}/${base}` : base;
}


//* 🟢 Presigned Upload Utility
function createPresignedPut({
  key,
  mimeType,
  expiresInSec = 300,
  cacheControl,
  signContentType = false,
  signCacheControl = false,
}) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresInSec,
  };

  if (signContentType && mimeType) params.ContentType = mimeType;


  if (signCacheControl && cacheControl) params.CacheControl = cacheControl;
  if (process.env.CLOUD_SPACE_OBJECT_ACL) params.ACL = process.env.CLOUD_SPACE_OBJECT_ACL;

  return new Promise((resolve, reject) => {
    s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}


//* 🟢 Cloud Object Operations
async function headObject({ key }) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  try {
    const meta = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return meta;
  } catch (err) {

    const code = err?.code || err?.name;
    if (code === "NotFound" || code === "NoSuchKey" || err?.statusCode === 404) {
      const e = new Error("فایل روی فضای ابری یافت نشد (upload انجام نشده یا key اشتباه است)");
      e.statusCode = 400;
      throw e;
    }
    throw err;
  }
}


async function deleteObject({ key }) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return { ok: true };
  } catch (err) {
    const code = err?.code || err?.name;
    if (code === "NotFound" || code === "NoSuchKey" || err?.statusCode === 404) {
      return { ok: true, notFound: true };
    }
    throw err;
  }
}


async function listObjects({
  prefix = "",
  continuationToken,
  startAfter,
  maxKeys = 200,
} = {}) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  const mk = Number(maxKeys);
  const MaxKeys = Number.isFinite(mk) ? Math.max(1, Math.min(1000, mk)) : 200;

  const prefixClean = prefix ? String(prefix).replace(/^\/+/, "") : undefined;

  const params = {
    Bucket: bucket,
    MaxKeys,
  };
  if (prefixClean) params.Prefix = prefixClean;
  if (continuationToken) params.ContinuationToken = String(continuationToken);
  if (startAfter) params.StartAfter = String(startAfter);

  const resp = await s3.listObjectsV2(params).promise();

  const items = Array.isArray(resp?.Contents)
    ? resp.Contents.map((o) => ({
        key: o.Key,
        size: o.Size,
        lastModified: o.LastModified,
        eTag: o.ETag,
        storageClass: o.StorageClass,
      }))
    : [];

  return {
    prefix: params.Prefix || "",
    maxKeys: MaxKeys,
    isTruncated: !!resp?.IsTruncated,
    nextContinuationToken: resp?.NextContinuationToken,
    items,
  };
}

//? 🔵 Export Utilities
module.exports = {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  headObject,
  deleteObject,
  listObjects,
};
