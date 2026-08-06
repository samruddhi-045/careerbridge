const jobRepo = require("../repositories/job.repository");
const AppError = require("../utils/AppError");

/**
 * Which status changes are allowed, and from where.
 *
 * Encoding this as a map rather than a pile of if-statements means the rules
 * are readable in one place, and an invalid transition (archived -> published,
 * say) is impossible rather than merely unlikely.
 */
const ALLOWED_TRANSITIONS = {
  draft: ["published", "archived"],
  published: ["closed", "archived"],
  closed: ["published", "archived"], // reopening a role is a real thing
  archived: [], // terminal
};

const requireCompany = (user) => {
  if (!user.companyId) {
    throw new AppError("Create or join a company before posting jobs", 403);
  }
  return user.companyId;
};

const listJobs = async (user, { status, page, limit }) => {
  const companyId = requireCompany(user);

  const [{ items, total }, counts] = await Promise.all([
    jobRepo.findAllByCompany(companyId, { status, page, limit }),
    jobRepo.countsByStatus(companyId),
  ]);

  return { items: items.map((j) => j.toCardJSON()), total, counts };
};

const getJob = async (user, id) => {
  const companyId = requireCompany(user);
  const job = await jobRepo.findOneByCompany(id, companyId);
  if (!job) throw new AppError("Job not found", 404);
  return job;
};

/**
 * Jobs are created as drafts by default. Writing a good posting takes more
 * than one sitting, and a half-written job appearing in search is worse than
 * no job at all.
 */
const createJob = async (user, data) => {
  const companyId = requireCompany(user);

  const shouldPublish = data.status === "published";

  return jobRepo.create({
    ...data,
    companyId,
    postedBy: user._id,
    status: shouldPublish ? "published" : "draft",
    publishedAt: shouldPublish ? new Date() : null,
  });
};

const updateJob = async (user, id, data) => {
  const companyId = requireCompany(user);

  // status changes go through changeStatus, which enforces the transition map
  const { status, publishedAt, ...safe } = data;

  const job = await jobRepo.update(id, companyId, safe);
  if (!job) throw new AppError("Job not found", 404);
  return job;
};

const changeStatus = async (user, id, nextStatus) => {
  const companyId = requireCompany(user);

  const job = await jobRepo.findOneByCompany(id, companyId);
  if (!job) throw new AppError("Job not found", 404);

  if (job.status === nextStatus) return job;

  if (!ALLOWED_TRANSITIONS[job.status].includes(nextStatus)) {
    throw new AppError(`A ${job.status} job can't be moved to ${nextStatus}`, 409);
  }

  const patch = { status: nextStatus };

  // publishedAt is set once, on first publish. Re-publishing a closed job
  // keeps the original date so search ordering doesn't treat an old role as new.
  if (nextStatus === "published" && !job.publishedAt) {
    patch.publishedAt = new Date();
  }

  return jobRepo.update(id, companyId, patch);
};

/**
 * Only drafts can be deleted outright. A job that was ever published may have
 * applications attached, and deleting it would leave candidates staring at a
 * missing record in their tracker -- archive is the right move there.
 */
const deleteJob = async (user, id) => {
  const companyId = requireCompany(user);

  const job = await jobRepo.findOneByCompany(id, companyId);
  if (!job) throw new AppError("Job not found", 404);

  if (job.status !== "draft") {
    throw new AppError("Only drafts can be deleted. Archive this job instead.", 409);
  }

  await jobRepo.remove(id, companyId);
};

module.exports = { listJobs, getJob, createJob, updateJob, changeStatus, deleteJob };