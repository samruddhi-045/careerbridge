// custom error for expected stuff like bad input or not found
// so the error handler knows it's safe to show the message to the user
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // this is a known error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
