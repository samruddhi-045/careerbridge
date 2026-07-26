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

// limits login/signup attempts so people can't brute-force passwords
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again in 15 minutes." },
  },
});

// separate signup routes per role, so the role comes from the URL not the body
router.post("/register/candidate", authLimiter, validate(registerSchema), ctrl.registerCandidate);
router.post("/register/recruiter", authLimiter, validate(registerSchema), ctrl.registerRecruiter);

// one login route for everyone, role comes from the account itself
router.post("/login", authLimiter, validate(loginSchema), ctrl.login);

router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);

// email verification
router.get("/verify-email/:token", ctrl.verifyEmail);
router.post("/resend-verification", authLimiter, validate(emailOnlySchema), ctrl.resendVerification);

// password reset
router.post("/forgot-password", authLimiter, validate(emailOnlySchema), ctrl.forgotPassword);
router.post("/reset-password/:token", authLimiter, validate(resetPasswordSchema), ctrl.resetPassword);

module.exports = router;