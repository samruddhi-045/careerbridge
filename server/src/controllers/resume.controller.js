const resumeService = require("../services/resume.service");
const catchAsync = require("../utils/catchAsync");

// Shared pagination parsing. Clamped so ?limit=100000 can't be used to pull
// everything in one request.
const readPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

const listResumes = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query);
  const { items, total } = await resumeService.listResumes(req.user._id, { page, limit });

  res.status(200).json({
    success: true,
    data: { resumes: items },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getResume = catchAsync(async (req, res) => {
  const resume = await resumeService.getResume(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: { resume } });
});

const createResume = catchAsync(async (req, res) => {
  const resume = await resumeService.createResume(req.user, req.body);
  res.status(201).json({ success: true, data: { resume }, message: "Resume created" });
});

const updateResume = catchAsync(async (req, res) => {
  const resume = await resumeService.updateResume(req.params.id, req.user._id, req.body);
  res.status(200).json({ success: true, data: { resume }, message: "Changes saved" });
});

const deleteResume = catchAsync(async (req, res) => {
  await resumeService.deleteResume(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: null, message: "Resume deleted" });
});

const duplicateResume = catchAsync(async (req, res) => {
  const resume = await resumeService.duplicateResume(req.user._id, req.params.id);
  res.status(201).json({ success: true, data: { resume }, message: "Resume duplicated" });
});

module.exports = { listResumes, getResume, createResume, updateResume, deleteResume, duplicateResume };