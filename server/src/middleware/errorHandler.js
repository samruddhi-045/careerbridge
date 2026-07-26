const AppError = require("../utils/AppError");

// converts errors from libraries (mongoose, jwt, etc.) into our AppError shape
const normalize = (err) => {
  // duplicate key error, e.g. email already registered
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || { field: null })[0];
    const e = new AppError(`An account with this ${field || "value"} already exists`, 409);
    e.name = "DUPLICATE_KEY";
    return e;
  }

  // mongoose schema validation failed
  if (err.name === "ValidationError") {
    const e = new AppError("Please check the highlighted fields", 400);
    e.name = "VALIDATION_ERROR";
    e.details = Object.values(err.errors).map((v) => ({
      field: v.path,
      message: v.message,
    }));
    return e;
  }

  // bad ObjectId in a route param, e.g. /users/123
  if (err.name === "CastError") {
    const e = new AppError("Invalid identifier", 400);
    e.name = "INVALID_ID";
    return e;
  }

  // expired or invalid jwt
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    const e = new AppError("Session expired. Please sign in again.", 401);
    e.name = "INVALID_TOKEN";
    return e;
  }

  return err;
};

// fallback error codes for the frontend, based on status code
const CODE_BY_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
};

// last middleware in the chain, sends every error as the same JSON shape
const errorHandler = (err, req, res, next) => {
  const error = normalize(err);

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // log unexpected errors so we can debug them, known errors don't need this
  if (!isOperational) {
    console.error(`[${req.method}] ${req.originalUrl} ->`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code:
        error.name && error.name !== "Error"
          ? error.name
          : CODE_BY_STATUS[statusCode] || "SERVER_ERROR",
      // don't send internal error details to the client
      message: isOperational ? error.message : "Something went wrong. Please try again.",
      ...(error.details ? { details: error.details } : {}),
    },
  });
};

// no route matched, pass it on to errorHandler
const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  err.name = "NOT_FOUND";
  next(err);
};

module.exports = { errorHandler, notFound };