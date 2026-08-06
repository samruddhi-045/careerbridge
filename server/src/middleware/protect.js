const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { verifyAccessToken } = require("../utils/token");
const { isTokenStale } = require("../utils/session");

// checks the access token and attaches req.user if it's valid
const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new AppError("Not authenticated", 401);

  const payload = verifyAccessToken(token); // throws if invalid/expired, errorHandler turns it into 401
  const user = await userRepo.findByIdForAuth(payload.sub);

  if (!user || user.status !== "active") {
    throw new AppError("Not authenticated", 401);
  }

  // A token minted before the last password change is dead, even if it hasn't
  // expired yet. This is what makes "reset password" actually kick out
  // whoever else was signed in.
  if (isTokenStale(user, payload)) {
    throw new AppError("Session expired. Please sign in again.", 401);
  }

  req.user = user;
  next();
});

// checks if req.user has one of the allowed roles, use after protect()
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have access to this resource", 403));
    }
    next();
  };

module.exports = { protect, requireRole };