const AppError = require("../utils/AppError");

const normalizeDuplicateKeyError = (error) => {
  const fields = Object.keys(error.keyValue || {}).join(", ");
  return new AppError(`Duplicate value for: ${fields}.`, 409);
};

const normalizeValidationError = (error) => {
  const message = Object.values(error.errors)
    .map((fieldError) => fieldError.message)
    .join(" ");
  return new AppError(message, 400);
};

const normalizeCastError = (error) => (
  new AppError(`Invalid ${error.path}: ${error.value}`, 400)
);

const errorHandler = (error, req, res, next) => {
  let err = error;

  if (error.code === 11000) {
    err = normalizeDuplicateKeyError(error);
  }

  if (error.name === "ValidationError") {
    err = normalizeValidationError(error);
  }

  if (error.name === "CastError") {
    err = normalizeCastError(error);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.isOperational ? err.message : "Something went wrong.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

module.exports = errorHandler;
