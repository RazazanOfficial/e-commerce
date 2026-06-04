//? 🔵 Required Modules
const jwt = require("jsonwebtoken");
const UserModel = require("../../models/userModel");
const AuthOtpModel = require("../../models/authOtpModel");
const { cookieOptions } = require("../../config/coockieOptions");
const { normalizePhone, toPublicUser } = require("../../utils/userSecurity");
const {
  generateNumericOtp,
  getOtpExpirySeconds,
  hashOtpCode,
  sendRegistrationOtp,
  shouldExposeDevCode,
  verifyOtpCode,
} = require("../../utils/otpService");

const { OTP_PURPOSES } = AuthOtpModel;
const { USER_ROLES = { USER: "user" } } = UserModel;
const namePattern = /^[A-Za-zآ-یء-ی\s‌-]+$/;
const phonePattern = /^09[0-9]{9}$/;
const codePattern = /^[0-9]{6}$/;

//* 🟢 Normalize Register Payload
const normalizeRegisterPayload = (body = {}) => {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = normalizePhone(body.phone);
  const code = String(body.code || "").trim();

  return { firstName, lastName, phone, code };
};

//* 🟢 Validate Register Identity
const validateRegisterIdentity = ({ firstName, lastName, phone }) => {
  if (!firstName || !lastName || !phone) {
    return "نام، نام خانوادگی و شماره موبایل الزامی است";
  }

  if (!namePattern.test(firstName) || firstName.length < 2 || firstName.length > 50) {
    return "نام نامعتبر است";
  }

  if (!namePattern.test(lastName) || lastName.length < 2 || lastName.length > 70) {
    return "نام خانوادگی نامعتبر است";
  }

  if (!phonePattern.test(phone)) {
    return "شماره موبایل نامعتبر است";
  }

  return null;
};

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

//* 🟢 Build Duplicate Phone Response
const buildDuplicatePhoneResponse = (res) =>
  res.status(409).json({
    data: null,
    success: false,
    error: true,
    message: "شماره موبایل تکراری است",
  });

//* 🟢 Request Registration Code Controller
const requestRegisterCodeController = async (req, res) => {
  try {
    const payload = normalizeRegisterPayload(req.body);
    const validationMessage = validateRegisterIdentity(payload);

    if (validationMessage) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: validationMessage,
      });
    }

    const existingUser = await UserModel.findOne({ phone: payload.phone }).select("_id").lean();
    if (existingUser) {
      return buildDuplicatePhoneResponse(res);
    }

    const code = generateNumericOtp();
    const expiresInSeconds = getOtpExpirySeconds();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await AuthOtpModel.updateMany(
      { phone: payload.phone, purpose: OTP_PURPOSES.REGISTER, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    await AuthOtpModel.create({
      phone: payload.phone,
      purpose: OTP_PURPOSES.REGISTER,
      codeHash: hashOtpCode(payload.phone, code),
      expiresAt,
    });

    await sendRegistrationOtp({ phone: payload.phone, code });

    return res.status(200).json({
      data: {
        phone: payload.phone,
        expiresInSeconds,
        ...(shouldExposeDevCode() ? { devCode: code } : {}),
      },
      success: true,
      error: false,
      message: "کد تایید برای شماره موبایل ارسال شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Request register code error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ارسال کد تایید",
    });
  }
};

//* 🟢 Verify Registration Code Controller
const verifyRegisterCodeController = async (req, res) => {
  try {
    const payload = normalizeRegisterPayload(req.body);
    const validationMessage = validateRegisterIdentity(payload);

    if (validationMessage) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: validationMessage,
      });
    }

    if (!codePattern.test(payload.code)) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "کد تایید نامعتبر است",
      });
    }

    const existingUser = await UserModel.findOne({ phone: payload.phone }).select("_id").lean();
    if (existingUser) {
      return buildDuplicatePhoneResponse(res);
    }

    const otpRecord = await AuthOtpModel.findOne({
      phone: payload.phone,
      purpose: OTP_PURPOSES.REGISTER,
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
        message: "کد تایید منقضی شده یا یافت نشد",
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

    const isValidCode = verifyOtpCode(payload.phone, payload.code, otpRecord.codeHash);
    if (!isValidCode) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "کد تایید اشتباه است",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const user = await UserModel.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: `${payload.firstName} ${payload.lastName}`,
      phone: payload.phone,
      phoneVerifiedAt: new Date(),
      role: USER_ROLES.USER,
    });

    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    setAuthCookie(res, user);

    return res.status(201).json({
      data: { user: toPublicUser(user) },
      success: true,
      error: false,
      message: "ثبت نام با موفقیت تکمیل شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Verify register code error:", error);

    const duplicateKeys = Object.keys(error?.keyPattern || error?.keyValue || {});
    const isDuplicateError = error?.code === 11000;
    const isDuplicatePhone = isDuplicateError && (!duplicateKeys.length || duplicateKeys.includes("phone"));
    const isDuplicateEmail = isDuplicateError && duplicateKeys.includes("email");

    if (isDuplicatePhone) {
      return buildDuplicatePhoneResponse(res);
    }

    if (isDuplicateEmail) {
      return res.status(500).json({
        data: null,
        success: false,
        error: true,
        message: "ایندکس ایمیل دیتابیس با ثبت‌نام بدون ایمیل سازگار نیست",
      });
    }

    return res.status(error?.statusCode || 500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در تکمیل ثبت نام",
    });
  }
};

//? 🔵 Export Controllers
module.exports = {
  requestRegisterCodeController,
  verifyRegisterCodeController,
};
