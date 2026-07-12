const AppError = require("../utils/appError");

const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let errors = error.errors || [];

  if (error.code === "23505") {
    statusCode = 409;
    message = "A record with this value already exists";
  }

  if (error.code === "23503") {
    statusCode = 400;
    message = "Related record does not exist";
  }

  if (!(error instanceof AppError) && statusCode === 500) {
    console.error(error);
    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
      errors = [];
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorHandler;
