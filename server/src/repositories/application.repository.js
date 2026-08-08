const Application = require("../models/Application");

const create = (data) => Application.create(data);

const findByJobAndCandidate = (jobId, candidateId) =>
  Application.findOne({ jobId, candidateId });

/**
 * Which of these jobs has the candidate already applied to?
 * One query for a page of results, rather than one per card.
 */
const findAppliedJobIds = async (candidateId, jobIds) => {
  const rows = await Application.find({ candidateId, jobId: { $in: jobIds } }).select("jobId status");
  return rows.reduce((acc, r) => ({ ...acc, [String(r.jobId)]: r.status }), {});
};

// Candidate-side: scoped by candidateId, so another user's application simply
// doesn't match rather than failing an ownership check.
const findAllByCandidate = async (candidateId, { status, page = 1, limit = 20 } = {}) => {
  const filter = { candidateId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "jobId",
        select: "title location workMode employmentType status companyId",
        populate: { path: "companyId", select: "name slug logoUrl" },
      }),
    Application.countDocuments(filter),
  ]);

  return { items, total };
};

const findOneByCandidate = (id, candidateId) =>
  Application.findOne({ _id: id, candidateId }).populate({
    path: "jobId",
    select: "title location workMode employmentType status companyId",
    populate: { path: "companyId", select: "name slug logoUrl" },
  });

// Recruiter-side: scoped by companyId. A recruiter can never reach another
// company's applications, because the company is part of the query.
const findAllByCompany = async (companyId, { jobId, status, page = 1, limit = 50 } = {}) => {
  const filter = { companyId };
  if (jobId) filter.jobId = jobId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title"),
    Application.countDocuments(filter),
  ]);

  return { items, total };
};

const findOneByCompany = (id, companyId) =>
  Application.findOne({ _id: id, companyId })
    .select("+recruiterNotes")
    .populate("candidateId", "fullName email")
    .populate("jobId", "title");

/**
 * Appends to statusHistory and sets status in ONE atomic update.
 * Doing it as read-modify-write would let two recruiters acting at the same
 * moment overwrite each other's history entry.
 */
const updateStatus = (filter, status, event) =>
  Application.findOneAndUpdate(
    filter,
    { status, $push: { statusHistory: event } },
    { new: true }
  );

const countsByStatus = async (companyId, jobId) => {
  const match = { companyId };
  if (jobId) match.jobId = jobId;

  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

module.exports = {
  create,
  findByJobAndCandidate,
  findAppliedJobIds,
  findAllByCandidate,
  findOneByCandidate,
  findAllByCompany,
  findOneByCompany,
  updateStatus,
  countsByStatus,
};