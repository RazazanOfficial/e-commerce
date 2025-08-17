//? 🔵Required Modules
const mongoose = require("mongoose");

//* 🟢Users Model
const userSchema = mongoose.Schema({
  name: String,
  phone: {
    type: String,
    required: true,
    unique: true,
    set: (value) => value.replace(/\D/g, ""),
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    set: (value) => value.toLowerCase(),
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  address: { type: String },
  postalCode: { type: String },
});

const UserModel = mongoose.model("User", userSchema);

//? 🔵Export Controller
module.exports = UserModel;
