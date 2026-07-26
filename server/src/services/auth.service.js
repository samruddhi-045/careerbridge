const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/token");
const { createToken, hashToken } = require("../utils/cryptoToken");
const { sendEmail } = require("../utils/email");

// all the business logic lives here, no req/res, just plain functions
const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

// fire-and-forget-ish: send the verification email for a freshly created/unverified user
const sendVerificationEmail = async (user) => {
  const { token, tokenHash } = createToken();
  await userRepo.setEmailVerificationToken(user._id, tokenHash, new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS));

  const link = `${clientUrl()}/verify-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your CareerBridge email",
    text: `Hi ${user.fullName}, verify your email: ${link} (expires in 24 hours)`,
    html: `<p>Hi ${user.fullName},</p><p>Verify your email to activate your CareerBridge account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
};

// role comes from the route (see auth.routes.js), never from req.body,
// otherwise anyone could sign up as an admin
const register = async ({ fullName, email, password, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ fullName, email, passwordHash, role });

  await sendVerificationEmail(user);

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

// token comes from the emailed link, see sendVerificationEmail above
const verifyEmail = async (token) => {
  if (!token) throw new AppError("Verification link is invalid", 400);

  const user = await userRepo.findByVerificationTokenHash(hashToken(token));
  if (!user) throw new AppError("Verification link is invalid or has expired", 400);

  return userRepo.markEmailVerified(user._id);
};

const resendVerification = async (email) => {
  const user = await userRepo.findByEmail(email);
  // don't reveal whether the email exists — same response either way
  if (!user || user.isEmailVerified) return;
  await sendVerificationEmail(user);
};

// always resolves the same way whether or not the email exists, so this can't be
// used to check which emails are registered
const forgotPassword = async (email) => {
  const user = await userRepo.findByEmail(email);
  if (!user) return;

  const { token, tokenHash } = createToken();
  await userRepo.setPasswordResetToken(user._id, tokenHash, new Date(Date.now() + PASSWORD_RESET_TTL_MS));

  const link = `${clientUrl()}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your CareerBridge password",
    text: `Reset your password: ${link} (expires in 1 hour). Ignore this if you didn't request it.`,
    html: `<p>Reset your CareerBridge password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. Ignore this email if you didn't request it.</p>`,
  });
};

const resetPassword = async (token, newPassword) => {
  if (!token) throw new AppError("Reset link is invalid", 400);

  const user = await userRepo.findByResetTokenHash(hashToken(token));
  if (!user) throw new AppError("Reset link is invalid or has expired", 400);

  const passwordHash = await hashPassword(newPassword);
  await userRepo.updatePassword(user._id, passwordHash);
};

module.exports = {
  register,
  login,
  refresh,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
