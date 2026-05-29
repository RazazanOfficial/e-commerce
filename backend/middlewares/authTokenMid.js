//? 🔵 Required Modules
const jwt = require("jsonwebtoken");

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();

  return null;
};

//* 🟢 Auth Token Middleware
const authTokenMid = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      data: null,
      success: false,
      error: true,
      message: "هنوز وارد حساب کاربری خود نشده اید",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err || !decoded?.id) {
      //! 🔴 Handle Errors
      return res.status(401).json({
        data: null,
        success: false,
        error: true,
        message: "حساب کاربری معتبر نیست",
      });
    }

    req.user = req.user || {};
    req.user.id = decoded.id;
    next();
  });
};

//? 🔵 Export Controller
module.exports = authTokenMid;
