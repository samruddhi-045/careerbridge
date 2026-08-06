const express = require("express");

const ctrl = require("../controllers/resume.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const { createResumeSchema, updateResumeSchema } = require("../validators/resume.validator");

const router = express.Router();

// Applies to every route below: signed in, and a candidate.
router.use(protect, requireRole("candidate"));

router
  .route("/")
  .get(ctrl.listResumes)
  .post(validate(createResumeSchema), ctrl.createResume);

// Specific routes above generic ones, as a habit.
router.post("/:id/duplicate", ctrl.duplicateResume);

router
  .route("/:id")
  .get(ctrl.getResume)
  .patch(validate(updateResumeSchema), ctrl.updateResume)
  .delete(ctrl.deleteResume);

module.exports = router;