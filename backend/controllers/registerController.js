//? 🔵Required Modules
const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");

//* 🟢User Registration Controller
const registerController = async (req, res) => {
  try {
    //* 🟢Validate Request Body
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: `Please fill the ${
          !name ? "name" : !email ? "email" : "password"
        } field`,
      });
    }

    //* 🟢Check for Existing User
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "Email is already registered",
      });
    }

    // * 🟢Hash Password (Sensitive Operation)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    //* 🟢Create New User Object
    const payload = {
      ...req.body,
      password: hash,
    };

    //* 🟢Save User to Database
    const userData = new UserModel(payload);
    const saveUser = await userData.save();

    //* 🟢Send Success Response
    res.status(201).json({
      data: saveUser,
      success: true,
      error: false,
      message: "User registered successfully",
    });

  } catch (error) {
    //! 🔴Handle Errors
    res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: error.message,
    });
  }
};

//? 🔵Export Controller
module.exports = registerController;
