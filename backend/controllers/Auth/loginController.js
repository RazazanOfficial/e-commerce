//? 🔵 Required Modules
const UserModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cookieOptions } = require("../../config/coockieOptions");
const { normalizeEmail, normalizePhone, toPublicUser } = require("../../utils/userSecurity");

//* 🟢 User Login Controller
const loginController = async (req, res) => {
  try {
    //* 🟢 Validate Request Body
    const { phoneOrEmail, password } = req.body || {};
    const identifier = String(phoneOrEmail || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری و رمز عبور الزامی است",
      });
    }

    const normalizedEmail = normalizeEmail(identifier);
    const normalizedPhone = normalizePhone(identifier);

    //* 🟢 Validation User Exist
    const user = await UserModel.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری یا رمز عبور اشتباه است",
      });
    }

    //* 🟢 Validation Password
    if (!user.password) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "برای این حساب رمز عبور تنظیم نشده است",
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری یا رمز عبور اشتباه است",
      });
    }

    //* 🟢 Generate JWT Token
    if (!process.env.JWT_SECRET) {
      throw new Error("Server Error");
    }
    const token = jwt.sign(
      { id: user._id, identifier: user.phone || user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, cookieOptions);

    //* 🟢 Send Success Response
    return res.status(200).json({
      data: { user: toPublicUser(user) },
      success: true,
      error: false,
      message: "ورود با موفقیت انجام شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Login error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ورود به سیستم",
    });
  }
};

//? 🔵 Export Controller
module.exports = loginController;
