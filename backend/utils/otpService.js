//? 🔵 Required Modules
const crypto = require("crypto");

const OTP_CODE_LENGTH = 6;

//* 🟢 OTP Helpers
const getOtpSecret = () => process.env.OTP_SECRET || process.env.JWT_SECRET || "development-otp-secret";

const generateNumericOtp = (length = OTP_CODE_LENGTH) => {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max).toString().padStart(length, "0");
  return code;
};

const hashOtpCode = (phone, code) =>
  crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${String(phone || "")}::${String(code || "")}`)
    .digest("hex");

const verifyOtpCode = (phone, code, codeHash) => {
  if (!codeHash) return false;

  const incomingHash = hashOtpCode(phone, code);
  const expected = Buffer.from(codeHash, "hex");
  const incoming = Buffer.from(incomingHash, "hex");

  if (expected.length !== incoming.length) return false;
  return crypto.timingSafeEqual(expected, incoming);
};

const getOtpExpirySeconds = () => {
  const seconds = Number.parseInt(process.env.AUTH_OTP_EXPIRES_SECONDS || process.env.REGISTER_OTP_EXPIRES_SECONDS, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
};

const getOtpExpiryMinutes = () => Math.ceil(getOtpExpirySeconds() / 60);

const shouldExposeDevCode = () =>
  process.env.NODE_ENV !== "production" && String(process.env.HIDE_DEV_OTP || "").toLowerCase() !== "true";

const sendRegistrationOtp = async ({ phone, code }) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[REGISTER_OTP] ${phone}: ${code}`);
  }

  return { provider: "console" };
};

const sendLoginOtp = async ({ phone, code }) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[LOGIN_OTP] ${phone}: ${code}`);
  }

  return { provider: "console" };
};

//? 🔵 Export Helpers
module.exports = {
  generateNumericOtp,
  getOtpExpiryMinutes,
  getOtpExpirySeconds,
  hashOtpCode,
  sendLoginOtp,
  sendRegistrationOtp,
  shouldExposeDevCode,
  verifyOtpCode,
};
