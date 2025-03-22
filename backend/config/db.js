const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    return { "Database Status": "Connected" };
  } catch (error) {
    return { "Database Status": "Error", "Error Message": error.message };
  }
};

module.exports = connectDB;
