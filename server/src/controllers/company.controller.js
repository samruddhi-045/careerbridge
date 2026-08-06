const companyService = require("../services/company.service");
const catchAsync = require("../utils/catchAsync");

const createCompany = catchAsync(async (req, res) => {
  const { company, user } = await companyService.createCompany(req.user, req.body);
  res.status(201).json({
    success: true,
    data: { company, user: user.toPublicJSON() },
    message: "Company created",
  });
});

// code comes from the body now, not a company id in the URL
const joinCompany = catchAsync(async (req, res) => {
  const { company, user } = await companyService.joinCompany(req.user, req.body.code);
  res.status(200).json({
    success: true,
    data: { company, user: user.toPublicJSON() },
    message: `Joined ${company.name}`,
  });
});

const getMyCompany = catchAsync(async (req, res) => {
  const company = await companyService.getMyCompany(req.user);
  res.status(200).json({ success: true, data: { company } });
});

const getCompany = catchAsync(async (req, res) => {
  const company = await companyService.getCompany(req.params.id);
  res.status(200).json({ success: true, data: { company } });
});

const searchCompanies = catchAsync(async (req, res) => {
  const companies = await companyService.searchCompanies(req.query.q);
  res.status(200).json({ success: true, data: { companies } });
});

const updateCompany = catchAsync(async (req, res) => {
  const company = await companyService.updateCompany(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, data: { company }, message: "Company updated" });
});

const getInviteCode = catchAsync(async (req, res) => {
  const inviteCode = await companyService.getInviteCode(req.user);
  res.status(200).json({ success: true, data: { inviteCode } });
});

const regenerateInviteCode = catchAsync(async (req, res) => {
  const inviteCode = await companyService.regenerateInviteCode(req.user);
  res.status(200).json({
    success: true,
    data: { inviteCode },
    message: "New code generated. The old one no longer works.",
  });
});

module.exports = {
  createCompany,
  joinCompany,
  getMyCompany,
  getCompany,
  searchCompanies,
  updateCompany,
  getInviteCode,
  regenerateInviteCode,
};