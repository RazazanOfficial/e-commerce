const errorHandler = (err, req, res, next) => {
  // console.error("ErrorHandler:", err.stack || err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: true,
    message: err.message || "خطای داخلی سرور",
  });
};

module.exports = errorHandler;