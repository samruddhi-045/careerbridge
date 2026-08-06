const jobService = require("../services/job.service");
const catchAsync = require("../utils/catchAsync");

// Clamped so ?limit=99999 can't be used to pull the whole collection.
const readPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

const listJobs = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query);
  const { items, total, counts } = await jobService.listJobs(req.user, {
    status: req.query.status,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: { jobs: items, counts },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getJob = catchAsync(async (req, res) => {
  const job = await jobService.getJob(req.user, req.params.id);
  res.status(200).json({ success: true, data: { job } });
});

const createJob = catchAsync(async (req, res) => {
  const job = await jobService.createJob(req.user, req.body);
  res.status(201).json({
    success: true,
    data: { job },
    message: job.status === "published" ? "Job published" : "Draft saved",
  });
});

const updateJob = catchAsync(async (req, res) => {
  const job = await jobService.updateJob(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, data: { job }, message: "Changes saved" });
});

const changeStatus = catchAsync(async (req, res) => {
  const job = await jobService.changeStatus(req.user, req.params.id, req.body.status);
  const messages = {
    published: "Job is now live",
    closed: "Job closed to new applications",
    archived: "Job archived",
    draft: "Job moved back to draft",
  };
  res.status(200).json({ success: true, data: { job }, message: messages[job.status] });
});

const deleteJob = catchAsync(async (req, res) => {
  await jobService.deleteJob(req.user, req.params.id);
  res.status(200).json({ success: true, data: null, message: "Draft deleted" });
});

module.exports = { listJobs, getJob, createJob, updateJob, changeStatus, deleteJob };