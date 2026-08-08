const applicationRepo = require("../repositories/application.repository");
const resumeRepo = require("../repositories/resume.repository");
const publicJobRepo = require("../repositories/publicJob.repository");
const Job = require("../models/Job");
const { PIPELINE_STAGES } = require("../models/Application");
const AppError = require("../utils/AppError");

/**
 * Who may move an application where.
 *
 * Two separate rule sets, because these are genuinely different powers:
 * a recruiter advances or rejects; a candidate can only ever withdraw. Neither
 * can do the other's job, and expressing that as data rather than nested ifs
 * makes it auditable at a glance.
 */
const RECRUITER_TRANSITIONS = {
  applied: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

const CANDIDATE_TRANSITIONS = {
  applied: ["withdrawn"],
  screening: ["withdrawn"],
  interview: ["withdrawn"],
  offer: ["withdrawn"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

/**
 * Copies the resume into the application.
 * toObject() then strip the identity fields so the snapshot is plain data
 * rather than a live mongoose document tied to the original.
 */
const buildSnapshot = (resume) => {
  const { _id, userId, createdAt, updatedAt, __v, ...rest } = resume.toObject();
  return { ...rest, resumeId: _id };
};

const apply = async (user, jobId, { resumeId, coverLetter }) => {
  const job = await publicJobRepo.findPublishedById(jobId);
  if (!job) throw new AppError("This job isn't available", 404);

  // Closed jobs stay READABLE (so shared links don't die) but not applicable.
  if (job.status !== "published") {
    throw new AppError("This role is no longer accepting applications", 409);
  }
  if (job.closesAt && new Date(job.closesAt) < new Date()) {
    throw new AppError("The deadline for this role has passed", 409);
  }

  // Scoped by owner, so a candidate can't attach someone else's resume
  const resume = await resumeRepo.findOneByUser(resumeId, user._id);
  if (!resume) throw new AppError("Pick one of your own resumes", 404);

  const existing = await applicationRepo.findByJobAndCandidate(jobId, user._id);
  if (existing) throw new AppError("You've already applied to this job", 409);

  let application;
  try {
    application = await applicationRepo.create({
      jobId,
      candidateId: user._id,
      companyId: job.companyId._id || job.companyId,
      resumeSnapshot: buildSnapshot(resume),
      coverLetter: coverLetter || "",
      status: "applied",
      statusHistory: [{ status: "applied", changedBy: user._id }],
    });
  } catch (err) {
    // The unique index is the real guard. Two rapid clicks both pass the
    // check above; only one survives the insert, and the loser lands here.
    if (err.code === 11000) throw new AppError("You've already applied to this job", 409);
    throw err;
  }

  /**
   * $inc, never `count += 1` then save. Two candidates applying in the same
   * second would both read the old value and both write the same new one,
   * silently losing a count. $inc is atomic in the database.
   */
  await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: 1 } });

  return application;
};

const listMyApplications = async (user, { status, page, limit }) => {
  const { items, total } = await applicationRepo.findAllByCandidate(user._id, { status, page, limit });

  const mapped = items.map((app) => ({
    ...app.toCandidateJSON(),
    job: app.jobId
      ? {
          id: app.jobId._id,
          title: app.jobId.title,
          status: app.jobId.status,
          location: app.jobId.location,
          workMode: app.jobId.workMode,
          employmentType: app.jobId.employmentType,
          company: app.jobId.companyId
            ? {
                id: app.jobId.companyId._id,
                name: app.jobId.companyId.name,
                logoUrl: app.jobId.companyId.logoUrl,
              }
            : null,
        }
      : null,
  }));

  return { items: mapped, total };
};

const getMyApplication = async (user, id) => {
  const app = await applicationRepo.findOneByCandidate(id, user._id);
  if (!app) throw new AppError("Application not found", 404);

  return {
    ...app.toCandidateJSON(),
    resumeSnapshot: app.resumeSnapshot,
    job: app.jobId
      ? {
          id: app.jobId._id,
          title: app.jobId.title,
          status: app.jobId.status,
          company: app.jobId.companyId?.name,
        }
      : null,
  };
};

/** Which of these jobs the candidate already applied to, and at what stage. */
const getAppliedMap = async (user, jobIds) => {
  if (!user || user.role !== "candidate" || !jobIds.length) return {};
  return applicationRepo.findAppliedJobIds(user._id, jobIds);
};

const withdraw = async (user, id) => {
  const app = await applicationRepo.findOneByCandidate(id, user._id);
  if (!app) throw new AppError("Application not found", 404);

  if (!CANDIDATE_TRANSITIONS[app.status].includes("withdrawn")) {
    throw new AppError(`An application that's ${app.status} can't be withdrawn`, 409);
  }

  return applicationRepo.updateStatus(
    { _id: id, candidateId: user._id },
    "withdrawn",
    { status: "withdrawn", changedBy: user._id, changedAt: new Date() }
  );
};

// ---- recruiter side ----

const requireCompany = (user) => {
  if (!user.companyId) throw new AppError("Join a company to view applications", 403);
  return user.companyId;
};

const listCompanyApplications = async (user, { jobId, status, page, limit }) => {
  const companyId = requireCompany(user);

  const [{ items, total }, counts] = await Promise.all([
    applicationRepo.findAllByCompany(companyId, { jobId, status, page, limit }),
    applicationRepo.countsByStatus(companyId, jobId),
  ]);

  const mapped = items.map((app) => ({
    id: app._id,
    status: app.status,
    appliedAt: app.createdAt,
    candidate: app.candidateId
      ? { id: app.candidateId._id, fullName: app.candidateId.fullName, email: app.candidateId.email }
      : null,
    job: app.jobId ? { id: app.jobId._id, title: app.jobId.title } : null,
    headline: app.resumeSnapshot?.summary?.slice(0, 160) || "",
    skills: (app.resumeSnapshot?.skills || []).flatMap((g) => g.items || []).slice(0, 8),
  }));

  return { items: mapped, total, counts };
};

const getCompanyApplication = async (user, id) => {
  const companyId = requireCompany(user);

  const app = await applicationRepo.findOneByCompany(id, companyId);
  if (!app) throw new AppError("Application not found", 404);

  return app;
};

const changeStatus = async (user, id, nextStatus, note) => {
  const companyId = requireCompany(user);

  const app = await applicationRepo.findOneByCompany(id, companyId);
  if (!app) throw new AppError("Application not found", 404);

  if (app.status === nextStatus) return app;

  if (!RECRUITER_TRANSITIONS[app.status].includes(nextStatus)) {
    throw new AppError(`An application that's ${app.status} can't be moved to ${nextStatus}`, 409);
  }

  return applicationRepo.updateStatus(
    { _id: id, companyId },
    nextStatus,
    { status: nextStatus, changedBy: user._id, changedAt: new Date(), note: note || "" }
  );
};

module.exports = {
  apply,
  listMyApplications,
  getMyApplication,
  getAppliedMap,
  withdraw,
  listCompanyApplications,
  getCompanyApplication,
  changeStatus,
  PIPELINE_STAGES,
  RECRUITER_TRANSITIONS,
};