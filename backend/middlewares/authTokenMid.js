const jwt = require("jsonwebtoken");

const authTokenMid = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({
      data: null,
      success: false,
      error: true,
      message: "هنوز وارد حساب کاربری خود نشده اید",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    // console.log({ token: token, decoded: decoded });
    if (err) {
      console.log("auth error : ", err);
      return res.status(401).json({
        data: null,
        success: false,
        error: true,
        message: "حساب کاربری معتبر نیست",
      });
    }

    req.user = req.user || {};
    req.user.id = decoded?.id;
    next();
  });
};

module.exports = authTokenMid;
