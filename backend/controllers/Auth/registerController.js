//? 🔵 Required Modules
const UserModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");

//* 🟢 User Registration Controller
const registerController = async (req, res) => {
  try {
    //* 🟢 Validate Request Body
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: `لطفا تمامی فیلدها را پر کنید`,
      });
    }

    //* 🟢 Validation Patterns
    const namePattern = /^[\u0600-\u06FF\s]+$/;
    const phonePattern = /^09[0-9]{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!namePattern.test(name)) {
      return res
        .status(400)
        .json({ message: "نام و نام خانوادگی نامعتبر است" });
    }
    if (!phonePattern.test(phone)) {
      return res.status(400).json({ message: "شماره موبایل نامعتبر است" });
    }
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "ایمیل نامعتبر است" });
    }


    if (password.length < 6) {
      return res.status(400).json({
        message: "پسورد باید حداقل ۶ کاراکتر باشد.",
      });
    }

    //* 🟢 Check Password Confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "پسورد و تایید پسورد یکسان نیستند",
      });
    }

    //* 🟢 Check for Existing User (Phone or Email)
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message:
          existingUser.phone === phone
            ? "کاربر با این شماره موبایل از قبل وجود دارد"
            : "کاربر با این ایمیل از قبل وجود دارد",
      });
    }


    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    //* 🟢 Create New User Object
    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      password: hash,
      role: "user",
    };

    //* 🟢 Save User to Database
    const userData = new UserModel(payload);
    const saveUser = await userData.save();

    //* 🟢 Send Success Response
        const safeUser = {
      _id: saveUser._id,
      name: saveUser.name,
      phone: saveUser.phone,
      email: saveUser.email,
      role: saveUser.role,
    };

    res.status(201).json({
      data: safeUser,
      success: true,
      error: false,
      message: "ثبت نام با موفقیت انجام شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: error.message,
    });
  }
};

//? 🔵 Export Controller
module.exports = registerController;
