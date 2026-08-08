const express = require("express");

const ctrl = require("../controllers/application.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const { applySchema, changeStatusSchema } = require("../validators/application.validator");

const router = express.Router();

router.use(protect);

/**
 * Candidate routes. Applying is scoped to a job id in the path so the body
 * can't influence which job is applied to.
 */
router.post("/jobs/:jobId/apply", requireRole("candidate"), validate(applySchema), ctrl.apply);

router.get("/me", requireRole("candidate"), ctrl.listMyApplications);
router.get("/me/:id", requireRole("candidate"), ctrl.getMyApplication);
router.post("/me/:id/withdraw", requireRole("candidate"), ctrl.withdraw);

/**
 * Recruiter routes. Withdraw is deliberately absent here -- only the candidate
 * can withdraw their own application; a recruiter rejects instead.
 */
router.get("/company", requireRole("recruiter", "company_admin"), ctrl.listCompanyApplications);
router.get("/company/:id", requireRole("recruiter", "company_admin"), ctrl.getCompanyApplication);
router.patch(
  "/company/:id/status",
  requireRole("recruiter", "company_admin"),
  validate(changeStatusSchema),
  ctrl.changeStatus
);

module.exports = router;