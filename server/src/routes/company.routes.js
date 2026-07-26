const express = require("express");

const ctrl = require("../controllers/company.controller");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/protect");
const { createCompanySchema, updateCompanySchema } = require("../validators/company.validator");

const router = express.Router();

router.use(protect); // every company route requires a signed-in user

// "/search" and "/me" must come before "/:id" or express will treat them as an id
router.get("/search", ctrl.searchCompanies);
router.get("/me", ctrl.getMyCompany);
router.post("/", requireRole("recruiter"), validate(createCompanySchema), ctrl.createCompany);
router.post("/:id/join", requireRole("recruiter"), ctrl.joinCompany);
router.get("/:id", ctrl.getCompany);
router.patch("/:id", requireRole("company_admin"), validate(updateCompanySchema), ctrl.updateCompany);

module.exports = router;
