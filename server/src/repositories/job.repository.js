const Job = require("../models/Job");

/**
 * Recruiter-side queries are scoped by companyId, not just _id.
 *
 * Same pattern as the resume repository: a request for another company's job
 * doesn't fail an ownership CHECK, it simply matches nothing. There is no
 * check to forget, and the 404 doesn't confirm the job exists.
 */
const findAllByCompany = async (companyId, { status, page = 1, limit = 20 } = {}) => {
  const filter = { companyId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  return { items, total };
};

const findOneByCompany = (id, companyId) => Job.findOne({ _id: id, companyId });

const create = (data) => Job.create(data);

const update = (id, companyId, data) =>
  Job.findOneAndUpdate({ _id: id, companyId }, data, { new: true, runValidators: true });

const remove = (id, companyId) => Job.findOneAndDelete({ _id: id, companyId });

// Counts per status, for the tabs on the recruiter's job list. One aggregation
// instead of four countDocuments calls.
const countsByStatus = async (companyId) => {
  const rows = await Job.aggregate([
    { $match: { companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

module.exports = { findAllByCompany, findOneByCompany, create, update, remove, countsByStatus };