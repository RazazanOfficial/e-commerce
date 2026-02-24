//? 🔵Required Modules
const UserModel = require("../../models/userModel");

//* 🟢UserDetails Controller
const userDetailsController = async (req, res) => {
  try {
        const user = await UserModel.findById(req.user.id).select("-password");
    res.status(200).json({
      data: user,
      success: true,
      error: false,
      message: "مشخصات کاربر",
    });
    // console.log("userId:", user);
  } catch (error) {
    //! 🔴Handle Errors
    console.error("Login error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "مشکلی در سرور پیش آمده",
    });
  }
};

//? 🔵Export Controller
module.exports = userDetailsController;
