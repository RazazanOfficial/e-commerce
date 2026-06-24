//? 🔵 Required Modules
const UserModel = require("../../models/userModel");
const AuthOtpModel = require("../../models/authOtpModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cookieOptions } = require("../../config/coockieOptions");
const { normalizeEmail, normalizePhone, toPublicUser } = require("../../utils/userSecurity");
const {
  generateNumericOtp,
  getOtpExpirySeconds,
  hashOtpCode,
  sendLoginOtp,
  shouldExposeDevCode,
  verifyOtpCode,
} = require("../../utils/otpService");

const { OTP_PURPOSES } = AuthOtpModel;
const phonePattern = /^09[0-9]{9}$/;
const codePattern = /^[0-9]{6}$/;

//* 🟢 Build Auth Token
const buildAuthToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT_SECRET is not configured");
    err.statusCode = 500;
    throw err;
  }

  return jwt.sign(
    { id: user._id, identifier: user.phone || user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//* 🟢 Set Auth Cookie
const setAuthCookie = (res, user) => {
  res.cookie("token", buildAuthToken(user), cookieOptions);
};

//* 🟢 Find User By Login Identifier
const findUserByIdentifier = (identifier) => {
  const normalizedEmail = normalizeEmail(identifier);
  const normalizedPhone = normalizePhone(identifier);
  const normalizedUsername = String(identifier || "").trim().toLowerCase();

  return UserModel.findOne({
    $or: [
      { username: normalizedUsername },
      { email: normalizedEmail },
      { phone: normalizedPhone },
    ],
  }).select("+password");
};

//* 🟢 User Password Login Controller
const loginController = async (req, res) => {
  try {
    //* 🟢 Validate Request Body
    const { phoneOrEmail, identifier: bodyIdentifier, username, phoneNumber, password } = req.body || {};
    const identifier = String(bodyIdentifier || phoneOrEmail || username || phoneNumber || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "نام کاربری/شماره موبایل و رمز عبور الزامی است",
      });
    }

    //* 🟢 Validation User Exist
    const user = await findUserByIdentifier(identifier);

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
        message: "برای این حساب رمز عبور تنظیم نشده است. با رمز یکبار مصرف وارد شوید یا رمز عبور تنظیم کنید",
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

    setAuthCookie(res, user);

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
    return res.status(error?.statusCode || 500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ورود به سیستم",
    });
  }
};

//* 🟢 Request Login OTP Controller
const requestLoginCodeController = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone || req.body?.phoneNumber);

    if (!phonePattern.test(phone)) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "شماره موبایل نامعتبر است",
      });
    }

    const user = await UserModel.findOne({ phone }).select("_id phone").lean();
    if (!user) {
      return res.status(404).json({
        data: null,
        success: false,
        error: true,
        message: "حسابی با این شماره موبایل پیدا نشد",
      });
    }

    const code = generateNumericOtp();
    const expiresInSeconds = getOtpExpirySeconds();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await AuthOtpModel.updateMany(
      { phone, purpose: OTP_PURPOSES.LOGIN, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    await AuthOtpModel.create({
      phone,
      purpose: OTP_PURPOSES.LOGIN,
      codeHash: hashOtpCode(phone, code),
      expiresAt,
    });

    await sendLoginOtp({ phone, code });

    return res.status(200).json({
      data: {
        phone,
        expiresInSeconds,
        ...(shouldExposeDevCode() ? { devCode: code } : {}),
      },
      success: true,
      error: false,
      message: "کد ورود برای شماره موبایل ارسال شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Request login code error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ارسال کد ورود",
    });
  }
};

//* 🟢 Verify Login OTP Controller
const verifyLoginCodeController = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone || req.body?.phoneNumber);
    const code = String(req.body?.code || "").trim();

    if (!phonePattern.test(phone)) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "شماره موبایل نامعتبر است",
      });
    }

    if (!codePattern.test(code)) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "کد ورود نامعتبر است",
      });
    }

    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        data: null,
        success: false,
        error: true,
        message: "حسابی با این شماره موبایل پیدا نشد",
      });
    }

    const otpRecord = await AuthOtpModel.findOne({
      phone,
      purpose: OTP_PURPOSES.LOGIN,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select("+codeHash phone purpose codeHash expiresAt attempts maxAttempts")
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "کد ورود منقضی شده یا یافت نشد",
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.consumedAt = new Date();
      await otpRecord.save();

      return res.status(429).json({
        data: null,
        success: false,
        error: true,
        message: "تعداد تلاش‌ها بیش از حد مجاز است. دوباره کد دریافت کنید",
      });
    }

    const isValidCode = verifyOtpCode(phone, code, otpRecord.codeHash);
    if (!isValidCode) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "کد ورود اشتباه است",
      });
    }

    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    if (!user.phoneVerifiedAt) {
      user.phoneVerifiedAt = new Date();
      await user.save();
    }

    setAuthCookie(res, user);

    return res.status(200).json({
      data: { user: toPublicUser(user) },
      success: true,
      error: false,
      message: "ورود با موفقیت انجام شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Verify login code error:", error);
    return res.status(error?.statusCode || 500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در تایید کد ورود",
    });
  }
};

//? 🔵 Export Controllers
module.exports = loginController;
module.exports.requestLoginCodeController = requestLoginCodeController;
module.exports.verifyLoginCodeController = verifyLoginCodeController;
