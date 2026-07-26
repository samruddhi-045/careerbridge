const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/token");

// all the business logic lives here, no req/res, just plain functions
const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

// role comes from the route (see auth.routes.js), never from req.body,
// otherwise anyone could sign up as an admin
const register = async ({ fullName, email, password, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ fullName, email, passwordHash, role });

  return { user, tokens: issueTokens(user) };
};

// same error message for "no such email" and "wrong password" on purpose,
// so people can't use this to check which emails are registered
const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email, { withPassword: true });

  // still runs against a dummy hash even if user is null, see utils/password.js
  const passwordMatches = await verifyPassword(password, user?.passwordHash);

  if (!user || !passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status === "suspended") {
    throw new AppError("This account has been suspended. Contact support.", 403);
  }

  await userRepo.touchLastLogin(user._id);

  return { user, tokens: issueTokens(user) };
};

// trades a valid refresh cookie for a new access token
const refresh = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Not authenticated", 401);

  // re-check the user in the DB instead of trusting the token, in case they got suspended
  const payload = verifyRefreshToken(refreshToken); // throws -> 401 in errorHandler
  const user = await userRepo.findById(payload.sub);

  if (!user || user.status !== "active") {
    throw new AppError("Not authenticated", 401);
  }

  return { user, tokens: issueTokens(user) };
};

const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

module.exports = { register, login, refresh, getMe };