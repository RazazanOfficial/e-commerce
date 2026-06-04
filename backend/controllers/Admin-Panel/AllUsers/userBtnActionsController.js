//? 🔵 Required Modules
const UserModel = require("../../../models/userModel");
const { buildSafeUserUpdates, USER_PUBLIC_FIELDS } = require("../../../utils/userSecurity");
const {
  assertCanManageUser,
  attachRoleMeta,
  filterHiddenDeveloperQuery,
  normalizeRoleKey,
} = require("../../../utils/roleService");

//* 🟢 Get One User Info Controller
const getSingleUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findOne({ _id: id, ...filterHiddenDeveloperQuery(req.userAccess) })
      .select(USER_PUBLIC_FIELDS)
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "کاربر پیدا نشد",
      });
    }

    return res.json({
      data: await attachRoleMeta(user),
      success: true,
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در دریافت اطلاعات کاربر",
    });
  }
};

//* 🟢 Update User Info Controller
const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await UserModel.findById(id).select(USER_PUBLIC_FIELDS);
    const nextRole = Object.prototype.hasOwnProperty.call(req.body || {}, "role")
      ? normalizeRoleKey(req.body.role)
      : null;

    if (nextRole || targetUser?.role !== "user") {
      await assertCanManageUser({
        actorAccess: req.userAccess,
        targetUser,
        nextRoleKey: nextRole,
      });
    }

    const updates = await buildSafeUserUpdates(req.body);
    if (nextRole) updates.role = nextRole;

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        data: null,
        success: false,
        error: true,
        message: "هیچ فیلد معتبری برای بروزرسانی ارسال نشده است",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .select(USER_PUBLIC_FIELDS)
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "کاربر برای بروزرسانی یافت نشد",
      });
    }

    return res.json({
      data: await attachRoleMeta(updatedUser),
      success: true,
      message: "کاربر با موفقیت ویرایش شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    const statusCode = error?.statusCode || (error?.code === 11000 ? 409 : 500);
    const duplicateField = error?.code === 11000 ? Object.keys(error.keyPattern || {})[0] : null;
    return res.status(statusCode).json({
      data: null,
      success: false,
      error: true,
      message:
        statusCode === 409
          ? `${duplicateField || "فیلد"} تکراری است`
          : error?.message || "خطا در ویرایش اطلاعات کاربر",
    });
  }
};

//* 🟢 Delete User Controller
const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await UserModel.findById(id).select(USER_PUBLIC_FIELDS);

    await assertCanManageUser({ actorAccess: req.userAccess, targetUser });

    const deletedUser = await UserModel.findByIdAndDelete(id).select("_id").lean();
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "کاربر پیدا نشد",
      });
    }

    return res.json({
      success: true,
      message: "کاربر با موفقیت حذف شد",
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(error?.statusCode || 500).json({
      data: null,
      success: false,
      error: true,
      message: error?.message || "خطا در حذف کاربر",
    });
  }
};

//? 🔵 Export Controller
module.exports = {
  getSingleUserController,
  updateUserController,
  deleteUserController,
};
