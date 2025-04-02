const mongoose = require("mongoose");

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
  password: String,
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
