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
    name: { type: String, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value) => String(value || "").replace(/\D/g, ""),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      set: (value) => String(value || "").trim().toLowerCase(),
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

//? 🔵 Export Controller
module.exports = UserModel;
module.exports.USER_ROLES = USER_ROLES;
