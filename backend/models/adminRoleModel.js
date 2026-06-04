//? 🔵 Required Modules
const mongoose = require("mongoose");

const SYSTEM_ROLE_KEYS = Object.freeze({
  USER: "user",
  ADMIN: "admin",
  OWNER: "owner",
  DEVELOPER: "developer",
});

const SYSTEM_ROLE_DEFINITIONS = Object.freeze({
  [SYSTEM_ROLE_KEYS.USER]: {
    name: "User",
    key: SYSTEM_ROLE_KEYS.USER,
    level: 0,
    description: "Default customer access",
    isSystem: true,
    locked: true,
    hidden: false,
  },
  [SYSTEM_ROLE_KEYS.ADMIN]: {
    name: "Admin",
    key: SYSTEM_ROLE_KEYS.ADMIN,
    level: 600,
    description: "Legacy admin access",
    isSystem: true,
    locked: true,
    hidden: false,
  },
  [SYSTEM_ROLE_KEYS.OWNER]: {
    name: "Owner",
    key: SYSTEM_ROLE_KEYS.OWNER,
    level: 900,
    description: "Store owner access",
    isSystem: true,
    locked: true,
    hidden: false,
  },
  [SYSTEM_ROLE_KEYS.DEVELOPER]: {
    name: "Developer",
    key: SYSTEM_ROLE_KEYS.DEVELOPER,
    level: 1000,
    description: "Platform developer access",
    isSystem: true,
    locked: true,
    hidden: true,
  },
});

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z][a-z0-9-]{1,48}$/,
    },
    level: { type: Number, required: true, min: 0, max: 1000 },
    description: { type: String, trim: true, maxlength: 300 },
    isSystem: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

roleSchema.index({ level: -1, name: 1 });

roleSchema.pre("validate", function normalizeRoleKey() {
  if (this.key) {
    this.key = String(this.key)
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

const AdminRoleModel = mongoose.model("AdminRole", roleSchema);

//? 🔵 Export Model
module.exports = AdminRoleModel;
module.exports.SYSTEM_ROLE_KEYS = SYSTEM_ROLE_KEYS;
module.exports.SYSTEM_ROLE_DEFINITIONS = SYSTEM_ROLE_DEFINITIONS;
