const express = require("express");

const ctrl = require("../controllers/job.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const {
  createJobSchema,
  updateJobSchema,
  changeStatusSchema,
} = require("../validators/job.validator");

const router = express.Router();

/**
 * Recruiter-side job management. The candidate-facing search lives separately
 * at /api/v1/jobs (public), because these two have completely different access
 * rules: this router requires a recruiter with a company; that one is open.
 */
router.use(protect, requireRole("recruiter", "company_admin"));

router.route("/").get(ctrl.listJobs).post(validate(createJobSchema), ctrl.createJob);

// specific path above "/:id" as a habit, even where there's no actual conflict
router.patch("/:id/status", validate(changeStatusSchema), ctrl.changeStatus);

router
  .route("/:id")
  .get(ctrl.getJob)
  .patch(validate(updateJobSchema), ctrl.updateJob)
  .delete(ctrl.deleteJob);

module.exports = router;