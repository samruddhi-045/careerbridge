const express = require("express");

const ctrl = require("../controllers/candidateProfile.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const { candidateProfileSchema } = require("../validators/candidateProfile.validator");

const router = express.Router();

router.use(protect);

router
  .route("/me")
  .get(requireRole("candidate"), ctrl.getMyProfile)
  .post(requireRole("candidate"), validate(candidateProfileSchema), ctrl.createMyProfile)
  .patch(requireRole("candidate"), validate(candidateProfileSchema), ctrl.updateMyProfile)
  .delete(requireRole("candidate"), ctrl.deleteMyProfile);

// recruiters and company admins can look up a candidate's profile by user id
router.get("/:userId", requireRole("recruiter", "company_admin"), ctrl.getProfileByUserId);

module.exports = router;
