const express = require("express");

const ctrl = require("../controllers/analytics.controller");
const { protect, requireRole } = require("../middleware/protect");

const router = express.Router();

router.use(protect);

// Each role sees only its own numbers -- both handlers scope by the caller
// (candidateId or companyId), so there's no shared endpoint to lock down.
router.get("/me", requireRole("candidate"), ctrl.candidateOverview);
router.get("/company", requireRole("recruiter", "company_admin"), ctrl.recruiterOverview);

module.exports = router;