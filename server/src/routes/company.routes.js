const express = require("express");
const rateLimit = require("express-rate-limit");

const ctrl = require("../controllers/company.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const {
  createCompanySchema,
  updateCompanySchema,
  joinCompanySchema,
} = require("../validators/company.validator");

const router = express.Router();

router.use(protect); // every company route requires a signed-in user

// An invite code is guessable in principle, so cap how fast anyone can try.
const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again later." },
  },
});

// "/search", "/me" and "/join" must come before "/:id" or express treats them as an id
router.get("/search", ctrl.searchCompanies);
router.get("/me", ctrl.getMyCompany);

// Joining is by code in the body. The old POST /:id/join is gone on purpose:
// it let any recruiter join any company whose id they could read from /search.
router.post("/join", requireRole("recruiter"), joinLimiter, validate(joinCompanySchema), ctrl.joinCompany);

// Only a company_admin can see or rotate the code that lets people in.
router.get("/invite-code", requireRole("company_admin"), ctrl.getInviteCode);
router.post("/invite-code/regenerate", requireRole("company_admin"), ctrl.regenerateInviteCode);

router.post("/", requireRole("recruiter"), validate(createCompanySchema), ctrl.createCompany);
router.get("/:id", ctrl.getCompany);
router.patch("/:id", requireRole("company_admin"), validate(updateCompanySchema), ctrl.updateCompany);

module.exports = router;