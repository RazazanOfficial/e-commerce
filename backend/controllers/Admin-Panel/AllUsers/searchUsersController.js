//? 🔵 Required Modules
const UserModel = require("../../../models/userModel");
const { escapeRegex, USER_PUBLIC_FIELDS } = require("../../../utils/userSecurity");

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
    const searchRegex = new RegExp(escapeRegex(String(q).trim()), "i");
    const filter = {
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
      ],
    };

    const [users, totalCount] = await Promise.all([
      UserModel.find(filter)
        .select(USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return res.json({
      data: users,
      page,
      limit,
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
