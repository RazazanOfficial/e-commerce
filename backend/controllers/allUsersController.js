const UserModel = require("../models/userModel");

const allUsersController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await UserModel.countDocuments();
    const users = await UserModel.find({}, "-password")
      .skip(skip)
      .limit(limit);

    return res.json({
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      totalCount: totalUsers,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در دریافت لیست کاربران",
    });
  }
};

module.exports = allUsersController;
