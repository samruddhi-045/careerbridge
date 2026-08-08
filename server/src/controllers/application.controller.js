const applicationService = require("../services/application.service");
const catchAsync = require("../utils/catchAsync");

const readPagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit };
};

// ---- candidate ----

const apply = catchAsync(async (req, res) => {
  const application = await applicationService.apply(req.user, req.params.jobId, req.body);
  res.status(201).json({
    success: true,
    data: { application: application.toCandidateJSON() },
    message: "Application submitted",
  });
});

const listMyApplications = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query);
  const { items, total } = await applicationService.listMyApplications(req.user, {
    status: req.query.status,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: { applications: items },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getMyApplication = catchAsync(async (req, res) => {
  const application = await applicationService.getMyApplication(req.user, req.params.id);
  res.status(200).json({ success: true, data: { application } });
});

const withdraw = catchAsync(async (req, res) => {
  const application = await applicationService.withdraw(req.user, req.params.id);
  res.status(200).json({
    success: true,
    data: { application: application.toCandidateJSON() },
    message: "Application withdrawn",
  });
});

// ---- recruiter ----

const listCompanyApplications = catchAsync(async (req, res) => {
  const { page, limit } = readPagination(req.query, 50);
  const { items, total, counts } = await applicationService.listCompanyApplications(req.user, {
    jobId: req.query.jobId,
    status: req.query.status,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: { applications: items, counts },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getCompanyApplication = catchAsync(async (req, res) => {
  const app = await applicationService.getCompanyApplication(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: {
      application: {
        id: app._id,
        status: app.status,
        appliedAt: app.createdAt,
        coverLetter: app.coverLetter,
        recruiterNotes: app.recruiterNotes,
        // The whole point of the snapshot: this is what they actually sent,
        // not whatever their resume looks like today.
        resumeSnapshot: app.resumeSnapshot,
        statusHistory: app.statusHistory,
        candidate: app.candidateId
          ? { id: app.candidateId._id, fullName: app.candidateId.fullName, email: app.candidateId.email }
          : null,
        job: app.jobId ? { id: app.jobId._id, title: app.jobId.title } : null,
      },
    },
  });
});

const changeStatus = catchAsync(async (req, res) => {
  const application = await applicationService.changeStatus(
    req.user,
    req.params.id,
    req.body.status,
    req.body.note
  );

  res.status(200).json({
    success: true,
    data: { application: { id: application._id, status: application.status } },
    message: `Moved to ${application.status}`,
  });
});

module.exports = {
  apply,
  listMyApplications,
  getMyApplication,
  withdraw,
  listCompanyApplications,
  getCompanyApplication,
  changeStatus,
};