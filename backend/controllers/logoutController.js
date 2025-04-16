const logoutController = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      message: "با موفقیت از حساب کاربری خارج شدید",
      success: true,
      data: null,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      message: "خطا در خروج از حساب کاربری",
      success: false,
      data: null,
      error: error.message,
    });
  }
};

module.exports = logoutController;
