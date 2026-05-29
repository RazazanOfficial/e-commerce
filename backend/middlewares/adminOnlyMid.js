//? 🔵 Required Modules
const UserModel = require("../models/userModel");
const { isAdminRole } = require("../utils/userSecurity");

//* 🟢 Admin Only Middleware
const adminOnlyMid = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        data: null,
        success: false,
        error: true,
        message: "توکن معتبر نیست یا شناسایی نشدید",
      });
    }

    const user = await UserModel.findById(req.user.id).select("role").lean();

    if (!user || !isAdminRole(user.role)) {
      return res.status(403).json({
        data: null,
        success: false,
        error: true,
        message: "شما اجازه دسترسی به این قسمت را ندارید",
      });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در بررسی دسترسی",
    });
  }
};

//? 🔵 Export Controller
module.exports = adminOnlyMid;
