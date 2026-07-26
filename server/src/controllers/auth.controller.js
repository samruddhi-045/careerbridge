const authService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");
const { refreshCookieOptions, REFRESH_COOKIE } = require("../utils/token");

// just handles req/res here, actual logic is in auth.service.js
const sendAuthResponse = (res, { user, tokens }, statusCode, message) => {
  // refresh token goes in a cookie, not the JSON body
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());

  res.status(statusCode).json({
    success: true,
    data: { user: user.toPublicJSON(), accessToken: tokens.accessToken },
    message,
  });
};

// creates a register handler for a fixed role, so candidate/recruiter signup
// share the same code but can't be swapped by the request body
const makeRegisterHandler = (role) =>
  catchAsync(async (req, res) => {
    const result = await authService.register({ ...req.body, role });
    sendAuthResponse(res, result, 201, "Account created");
  });

const registerCandidate = makeRegisterHandler("candidate");
const registerRecruiter = makeRegisterHandler("recruiter");

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result, 200, "Signed in");
});

const refresh = catchAsync(async (req, res) => {
  const result = await authService.refresh(req.cookies[REFRESH_COOKIE]);
  sendAuthResponse(res, result, 200, "Session refreshed");
});

const logout = catchAsync(async (req, res) => {
  // options here need to match how the cookie was set, or it won't clear
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, data: null, message: "Signed out" });
});

const me = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.status(200).json({ success: true, data: { user: user.toPublicJSON() } });
});

const verifyEmail = catchAsync(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  res.status(200).json({ success: true, data: { user: user.toPublicJSON() }, message: "Email verified" });
});

const resendVerification = catchAsync(async (req, res) => {
  await authService.resendVerification(req.body.email);
  // always a generic response, so this can't be used to check which emails exist
  res.status(200).json({
    success: true,
    data: null,
    message: "If that email is registered and unverified, a verification link was sent.",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    data: null,
    message: "If that email is registered, a password reset link was sent.",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res.status(200).json({ success: true, data: null, message: "Password updated. You can sign in now." });
});

module.exports = {
  registerCandidate,
  registerRecruiter,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};