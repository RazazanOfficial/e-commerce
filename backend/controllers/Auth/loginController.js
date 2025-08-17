//? 🔵Required Modules
const UserModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const coockieOptions = require("../../config/coockieOptions");

//* 🟢User Logination Controller
const loginController = async (req, res) => {
  try {

    //* 🟢Validate Request Body
    const { phoneOrEmail, password } = req.body;
    
    //* 🟢Validation User Exist
    const user = await UserModel.findOne({
      $or: [{ email: phoneOrEmail }, { phone: phoneOrEmail }],
    });
    if (!user) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری یا رمز عبور اشتباه است",
      });
    }

    //* 🟢Validation Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری یا رمز عبور اشتباه است",
      });
    }

    //* 🟢Generate JWT Token
    if (!process.env.JWT_SECRET) {
      throw new Error("Server Error");
    }
    const token = jwt.sign(
      { id: user._id, identifier: user.phone || user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token , coockieOptions);

    //* 🟢Send Success Response
    return res.status(200).json({
      data: { token, userId: user._id },
      success: true,
      error: false,
      message: "ورود با موفقیت انجام شد",
    });
  } catch (error) {
    //! 🔴Handle Errors
    console.error("Login derror:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ورود به سیستم",
    });
  }
};

//? 🔵Export Controller
module.exports = loginController;
