//? 🔵Required Modules
const UserModel = require("../../../models/userModel");

//* 🟢Search Users Controller
const searchUsersController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "عبارت جستجو وارد نشده است",
      });
    }

    const searchRegex = new RegExp(q, "i");

    const users = await UserModel.find(
      {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
        ],
      },
      "-password"
    ).sort({ createdAt: -1 });

    return res.json({
      data: users,
      totalCount: users.length,
      success: true,
    });
  } catch (error) {
    //! 🔴Handle Errors
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در جستجوی کاربران",
    });
  }
};

//? 🔵Export Controller
module.exports = searchUsersController;
