const publicJobRepo = require("../repositories/publicJob.repository");
const savedJobRepo = require("../repositories/savedJob.repository");
const applicationRepo = require("../repositories/application.repository");
const AppError = require("../utils/AppError");

/**
 * Shapes a job for candidate-facing output.
 *
 * Note what is NOT here: postedBy, applicationCount, and the salary object
 * when isVisible is false. A recruiter's internal numbers aren't a candidate's
 * business, and it's safer to whitelist fields than to remember to strip them.
 */
const toPublicCard = (job, savedIds = [], appliedMap = {}) => ({
  id: job._id,
  title: job.title,
  company: job.companyId
    ? {
        id: job.companyId._id,
        name: job.companyId.name,
        slug: job.companyId.slug,
        logoUrl: job.companyId.logoUrl,
      }
    : null,
  location: job.location,
  employmentType: job.employmentType,
  workMode: job.workMode,
  experienceLevel: job.experienceLevel,
  salary: job.salary?.isVisible ? job.salary : null,
  skills: job.skills?.slice(0, 8) || [],
  status: job.status,
  publishedAt: job.publishedAt,
  isSaved: savedIds.includes(String(job._id)),
  // null when not applied; otherwise the current stage, so a card can show
  // "Applied" rather than offering a button that would 409.
  appliedStatus: appliedMap[String(job._id)] || null,
});

const toPublicDetail = (job, isSaved, appliedStatus) => ({
  ...toPublicCard(job, isSaved ? [String(job._id)] : [], appliedStatus ? { [String(job._id)]: appliedStatus } : {}),
  description: job.description,
  responsibilities: job.responsibilities,
  requirements: job.requirements,
  niceToHaves: job.niceToHaves,
  skills: job.skills,
  openings: job.openings,
  closesAt: job.closesAt,
  company: job.companyId
    ? {
        id: job.companyId._id,
        name: job.companyId.name,
        slug: job.companyId.slug,
        logoUrl: job.companyId.logoUrl,
        industry: job.companyId.industry,
        website: job.companyId.website,
        description: job.companyId.description,
        location: job.companyId.location,
        size: job.companyId.size,
      }
    : null,
});

/**
 * `user` is optional -- search is public. When someone IS signed in we do one
 * extra query to mark which results they've already saved, rather than one
 * lookup per card.
 */
const searchJobs = async (params, user) => {
  const { items, total } = await publicJobRepo.search(params);

  let savedIds = [];
  let appliedMap = {};

  // Two extra queries for a whole page, not one per card.
  if (user?.role === "candidate" && items.length) {
    const ids = items.map((j) => j._id);
    [savedIds, appliedMap] = await Promise.all([
      savedJobRepo.findSavedIds(user._id, ids),
      applicationRepo.findAppliedJobIds(user._id, ids),
    ]);
  }

  return { items: items.map((j) => toPublicCard(j, savedIds, appliedMap)), total };
};

const getJob = async (id, user) => {
  const job = await publicJobRepo.findPublishedById(id);
  // Drafts and archived jobs are invisible; closed ones are still readable so
  // a shared link doesn't 404 the moment hiring finishes.
  if (!job) throw new AppError("This job isn't available", 404);

  let isSaved = false;
  let appliedStatus = null;

  if (user?.role === "candidate") {
    const [saved, applied] = await Promise.all([
      savedJobRepo.findSavedIds(user._id, [job._id]),
      applicationRepo.findAppliedJobIds(user._id, [job._id]),
    ]);
    isSaved = saved.length > 0;
    appliedStatus = applied[String(job._id)] || null;
  }

  return toPublicDetail(job, isSaved, appliedStatus);
};

const saveJob = async (user, jobId) => {
  // Verify the job is real and visible before saving, so the shortlist can't
  // be filled with ids for drafts or jobs that don't exist.
  const job = await publicJobRepo.findPublishedById(jobId);
  if (!job) throw new AppError("This job isn't available", 404);

  await savedJobRepo.save(user._id, jobId);
};

const unsaveJob = async (user, jobId) => {
  await savedJobRepo.unsave(user._id, jobId);
};

/**
 * The saved list joins in reverse: fetch the saved rows, then the jobs.
 * Jobs deleted since saving are filtered out rather than rendered as blanks.
 */
const listSavedJobs = async (user, pagination) => {
  const { rows, total } = await savedJobRepo.findAllByUser(user._id, pagination);
  if (!rows.length) return { items: [], total };

  const jobs = await publicJobRepo.findManyByIds(rows.map((r) => r.jobId));

  // Preserve save order rather than mongo's natural order
  const byId = new Map(jobs.map((j) => [String(j._id), j]));
  const items = rows
    .map((r) => byId.get(String(r.jobId)))
    .filter(Boolean)
    .map((j) => toPublicCard(j, [String(j._id)]));

  return { items, total };
};

module.exports = { searchJobs, getJob, saveJob, unsaveJob, listSavedJobs };