const analyticsService = require("../services/analytics.service");
const catchAsync = require("../utils/catchAsync");

const candidateOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getCandidateOverview(req.user);
  res.status(200).json({ success: true, data });
});

const recruiterOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getRecruiterOverview(req.user, req.query.jobId);
  res.status(200).json({ success: true, data });
});

module.exports = { candidateOverview, recruiterOverview };