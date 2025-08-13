const UserModel = require("../../../models/userModel");

const getSingleUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id, "-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "کاربر پیدا نشد",
      });
    }
    return res.json({
      data: user,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در دریافت اطلاعات کاربر",
    });
  }
};

const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "کاربر برای بروزرسانی یافت نشد",
      });
    }

    return res.json({
      data: updatedUser,
      success: true,
      message: "کاربر با موفقیت ویرایش شد",
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در ویرایش اطلاعات کاربر",
    });
  }
};

const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(id);
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
    return res.status(500).json({
      data: null,
      success: false,
      error: true,
      message: "خطا در حذف کاربر",
    });
  }
};

module.exports = {
  getSingleUserController,
  updateUserController,
  deleteUserController,
};
