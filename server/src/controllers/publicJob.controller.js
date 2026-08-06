const publicJobService = require("../services/publicJob.service");
const catchAsync = require("../utils/catchAsync");

const readPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

// req.user may be undefined here -- this route uses optionalAuth, not protect
const searchJobs = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query);
  const { items, total } = await publicJobService.searchJobs(
    { ...req.query, page, limit },
    req.user
  );

  res.status(200).json({
    success: true,
    data: { jobs: items },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getJob = catchAsync(async (req, res) => {
  const job = await publicJobService.getJob(req.params.id, req.user);
  res.status(200).json({ success: true, data: { job } });
});

const saveJob = catchAsync(async (req, res) => {
  await publicJobService.saveJob(req.user, req.params.id);
  res.status(200).json({ success: true, data: null, message: "Saved" });
});

const unsaveJob = catchAsync(async (req, res) => {
  await publicJobService.unsaveJob(req.user, req.params.id);
  res.status(200).json({ success: true, data: null, message: "Removed from saved" });
});

const listSavedJobs = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query);
  const { items, total } = await publicJobService.listSavedJobs(req.user, { page, limit });

  res.status(200).json({
    success: true,
    data: { jobs: items },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

module.exports = { searchJobs, getJob, saveJob, unsaveJob, listSavedJobs };