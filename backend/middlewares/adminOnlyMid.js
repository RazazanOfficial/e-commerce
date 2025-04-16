const UserModel = require("../models/userModel");

const adminOnlyMid = async (req, res, next) => {
  try {
    console.log("✅ adminOnlyMid -> req.user:", req.user); // 👈 لاگ اصلی
    if (!req.user?.id) {
      return res.status(401).json({
        data: null,
        success: false,
        error: true,
        message: "توکن معتبر نیست یا شناسایی نشدید",
      });
    }

    const user = await UserModel.findById(req.user.id);
    console.log("✅ current user:", user); // 👈 ببینیم چی برمی‌گرده

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        data: null,
        success: false,
        error: true,
        message: "شما اجازه دسترسی به این قسمت را ندارید",
      });
    }

    next();
  } catch (error) {
    console.log("adminOnly error : ", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در بررسی دسترسی",
    });
  }
};

module.exports = adminOnlyMid;
