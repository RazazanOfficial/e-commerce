//? 🔵 Required Modules
const UserModel = require("../../../models/userModel");
const { buildManageableUsersFilter, buildSearchFilter, buildUserListPipeline, combineUserFilters, normalizeUserSort } = require("../../../utils/userListQuery");

//* 🟢 Search Users Controller
const searchUsersController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !String(q).trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "عبارت جستجو وارد نشده است",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const sort = normalizeUserSort(req.query.sort);
    const filter = combineUserFilters(buildManageableUsersFilter(), buildSearchFilter(q));

    const [users, totalCount] = await Promise.all([
      UserModel.aggregate(buildUserListPipeline({ filter, sort, skip, limit })),
      UserModel.countDocuments(filter),
    ]);

    return res.json({
      data: users,
      page,
      limit,
      sort,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
    });
  } catch (error) {
    //! 🔴 Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در جستجوی کاربران",
    });
  }
};

//? 🔵 Export Controller
module.exports = searchUsersController;
