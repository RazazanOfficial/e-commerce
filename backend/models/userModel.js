const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name : String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  profilePic: String,
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
