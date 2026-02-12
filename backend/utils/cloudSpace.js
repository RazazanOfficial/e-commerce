const crypto = require("crypto");
const path = require("path");
const AWS = require("aws-sdk");

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

function extFrom({ fileName, mimeType }) {
  const ext = path.extname(fileName || "").toLowerCase().replace(".", "");
  if (ext) return ext;
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
  return map[mimeType] || "bin";
}

function generateObjectKey({ fileName, mimeType }) {
  // user requested: include time.now() in name. Add short random suffix to prevent same-ms collisions.
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  const ext = extFrom({ fileName, mimeType });
  return `${ts}-${rand}.${ext}`;
}

function getS3Client() {
  const endpointHost = mustEnv("CLOUD_SPACE_END_POINT_URL");
  const accessKeyId = mustEnv("CLOUD_SPACE_ACCESS_KEY");
  const secretAccessKey = mustEnv("CLOUD_SPACE_SECRET_KEY");

  const endpoint = new AWS.Endpoint(`https://${endpointHost}`);

  return new AWS.S3({
    endpoint,
    accessKeyId,
    secretAccessKey,
    region: process.env.CLOUD_SPACE_REGION || "us-east-1",
    signatureVersion: "v4",
    s3ForcePathStyle: true,
  });
}

function buildPublicUrl(key) {
  const base = cleanBaseUrl(mustEnv("CLOUD_SPACE_PUBLIC_BASE_URL"));
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  return `${base}/${bucket}/${encodeURIComponent(key)}`;
}

function createPresignedPut({ key, mimeType, expiresInSec = 300 }) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresInSec,
    ContentType: mimeType,
  };

  if (process.env.CLOUD_SPACE_OBJECT_ACL) {
    params.ACL = process.env.CLOUD_SPACE_OBJECT_ACL;
  }

  return new Promise((resolve, reject) => {
    s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

async function uploadBuffer({ key, buffer, mimeType, cacheControl }) {
  const bucket = mustEnv("CLOUD_SPACE_BUCKET");
  const s3 = getS3Client();

  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  if (cacheControl) params.CacheControl = cacheControl;
  if (process.env.CLOUD_SPACE_OBJECT_ACL) params.ACL = process.env.CLOUD_SPACE_OBJECT_ACL;

  // managed upload (handles multipart if needed)
  await s3.upload(params).promise();
}

module.exports = {
  generateObjectKey,
  buildPublicUrl,
  createPresignedPut,
  uploadBuffer,
};
