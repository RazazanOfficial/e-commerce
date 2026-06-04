//? 🔵 Required Modules
const UserModel = require("../../models/userModel");
const { USER_PUBLIC_FIELDS } = require("../../utils/userSecurity");
const { attachRoleMeta, getUserAccess } = require("../../utils/roleService");

//* 🟢 UserDetails Controller
const userDetailsController = async (req, res) => {
  try {
    await getUserAccess(req.user.id);
    const user = await UserModel.findById(req.user.id).select(USER_PUBLIC_FIELDS).lean();

    if (!user) {
      return res.status(404).json({
        data: null,
        success: false,
        error: true,
        message: "کاربر پیدا نشد",
      });
    }

    res.status(200).json({
      data: await attachRoleMeta(user),
      success: true,
      error: false,
      message: "مشخصات کاربر",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    console.error("userDetails error:", error);
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "مشکلی در سرور پیش آمده",
    });
  }
};

//? 🔵 Export Controller
module.exports = userDetailsController;
