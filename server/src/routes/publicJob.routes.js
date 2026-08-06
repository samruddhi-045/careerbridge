const express = require("express");

const ctrl = require("../controllers/publicJob.controller");
const optionalAuth = require("../middleware/optionalAuth");
const { protect, requireRole } = require("../middleware/protect");

const router = express.Router();

/**
 * Browsing is public; saving needs an account.
 *
 * That split is deliberate: if search sat behind a login, every job link
 * anyone shared would be a dead end for people without accounts, which is
 * exactly the audience a job board wants to reach.
 */

// "/saved" must be registered before "/:id", or express reads "saved" as a job id
router.get("/saved", protect, requireRole("candidate"), ctrl.listSavedJobs);

router.get("/", optionalAuth, ctrl.searchJobs);
router.get("/:id", optionalAuth, ctrl.getJob);

router.post("/:id/save", protect, requireRole("candidate"), ctrl.saveJob);
router.delete("/:id/save", protect, requireRole("candidate"), ctrl.unsaveJob);

module.exports = router;