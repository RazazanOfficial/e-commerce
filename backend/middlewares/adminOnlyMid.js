//? 🔵 Required Modules
const { getUserAccess } = require("../utils/roleService");

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

    const access = await getUserAccess(req.user.id);

    if (!access?.canAccessAdmin) {
      return res.status(403).json({
        data: null,
        success: false,
        error: true,
        message: "شما اجازه دسترسی به این قسمت را ندارید",
      });
    }

    req.user.role = access.roleKey;
    req.user.roleLevel = access.level;
    req.user.isDeveloper = access.isDeveloper;
    req.userAccess = access;
    next();
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("Admin access error:", error);
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
