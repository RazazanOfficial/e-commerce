const errorHandler = (err, req, res, next) => {


  res.status(err.statusCode || 500).json({
    success: false,
    error: true,
    message: err.message || "خطای داخلی سرور",
  });
};

module.exports = errorHandler;