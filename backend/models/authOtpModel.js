//? 🔵 Required Modules
const mongoose = require("mongoose");

const OTP_PURPOSES = Object.freeze({
  REGISTER: "REGISTER",
});

//* 🟢 Auth OTP Model
const authOtpSchema = mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
      set: (value) => String(value || "").replace(/\D/g, ""),
    },
    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSES),
      required: true,
      index: true,
    },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, default: null, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1 },
  },
  { timestamps: true }
);

authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authOtpSchema.index({ phone: 1, purpose: 1, consumedAt: 1, createdAt: -1 });

const AuthOtpModel = mongoose.model("AuthOtp", authOtpSchema);

//? 🔵 Export Model
module.exports = AuthOtpModel;
module.exports.OTP_PURPOSES = OTP_PURPOSES;
