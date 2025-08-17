const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: true,
    message: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = apiLimiter;