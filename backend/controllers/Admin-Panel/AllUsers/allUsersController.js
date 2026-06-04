//? 🔵 Required Modules
const UserModel = require("../../../models/userModel");
const { USER_PUBLIC_FIELDS } = require("../../../utils/userSecurity");
const { attachRoleMeta, filterHiddenDeveloperQuery } = require("../../../utils/roleService");

//* 🟢 All Users List Controller
const allUsersController = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const filter = filterHiddenDeveloperQuery(req.userAccess);

    const [totalUsers, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .select(USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const safeUsers = await Promise.all(users.map((user) => attachRoleMeta(user)));

    return res.json({
      data: safeUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      totalCount: totalUsers,
      success: true,
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در دریافت لیست کاربران",
    });
  }
};

//? 🔵 Export Controller
module.exports = allUsersController;
