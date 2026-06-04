//? 🔵 Required Modules
const mongoose = require("mongoose");

const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
  DEVELOPER: "developer",
});

//* 🟢 Users Model
const userSchema = mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value) => String(value || "").replace(/\D/g, ""),
    },
    phoneVerifiedAt: { type: Date, default: null },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      set: (value) => {
        const email = String(value || "").trim().toLowerCase();
        return email || undefined;
      },
    },
    emailVerifiedAt: { type: Date, default: null },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    province: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre("validate", function syncDisplayName() {
  const firstName = String(this.firstName || "").trim();
  const lastName = String(this.lastName || "").trim();

  if (!this.name && (firstName || lastName)) {
    this.name = [firstName, lastName].filter(Boolean).join(" ");
  }

  if ((!firstName || !lastName) && this.name) {
    const parts = String(this.name).trim().split(/\s+/).filter(Boolean);
    if (!firstName && parts[0]) this.firstName = parts[0];
    if (!lastName && parts.length > 1) this.lastName = parts.slice(1).join(" ");
  }
});

const UserModel = mongoose.model("User", userSchema);

//? 🔵 Export Controller
module.exports = UserModel;
module.exports.USER_ROLES = USER_ROLES;
