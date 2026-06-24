//? 🔵 Required Modules
const UserModel = require("../../../models/userModel");
const { buildManageableUsersFilter, buildUserListPipeline, normalizeUserSort } = require("../../../utils/userListQuery");

//* 🟢 All Users List Controller
const allUsersController = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const sort = normalizeUserSort(req.query.sort);
    const filter = buildManageableUsersFilter();

    const [totalUsers, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.aggregate(buildUserListPipeline({ filter, sort, skip, limit })),
    ]);

    return res.json({
      data: users,
      page,
      limit,
      sort,
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
