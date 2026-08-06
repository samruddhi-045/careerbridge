const express = require("express");
const rateLimit = require("express-rate-limit");

const ctrl = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/protect");
const {
  registerSchema,
  loginSchema,
  emailOnlySchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

/**
 * Separate limiters per concern.
 *
 * One shared limiter pooled its budget across login, signup and the
 * email-sending routes -- so mistyping a password a few times and then asking
 * for a reset could lock you out of both. On an office or campus network,
 * where everyone shares one public IP, that budget is shared by the whole
 * building. Each limiter now counts only its own kind of request.
 */
const makeLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: "TOO_MANY_REQUESTS", message } },
  });

// Strict: this is the one an attacker hammers to guess passwords.
const loginLimiter = makeLimiter(15 * 60 * 1000, 10, "Too many sign-in attempts. Try again in 15 minutes.");

// Looser, longer window: stops bulk account creation without blocking a
// household or office where several people sign up the same day.
const signupLimiter = makeLimiter(60 * 60 * 1000, 20, "Too many accounts created. Try again later.");

// Every request here sends a real email, so this protects the mail reputation
// as much as the app.
const emailLimiter = makeLimiter(15 * 60 * 1000, 5, "Too many requests. Try again in 15 minutes.");

// separate signup routes per role, so the role comes from the URL not the body
router.post("/register/candidate", signupLimiter, validate(registerSchema), ctrl.registerCandidate);
router.post("/register/recruiter", signupLimiter, validate(registerSchema), ctrl.registerRecruiter);

// one login route for everyone, role comes from the account itself
router.post("/login", loginLimiter, validate(loginSchema), ctrl.login);

router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);

// email verification
router.get("/verify-email/:token", ctrl.verifyEmail);
router.post("/resend-verification", emailLimiter, validate(emailOnlySchema), ctrl.resendVerification);

// password reset
router.post("/forgot-password", emailLimiter, validate(emailOnlySchema), ctrl.forgotPassword);
router.post("/reset-password/:token", loginLimiter, validate(resetPasswordSchema), ctrl.resetPassword);

module.exports = router;