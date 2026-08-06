const SavedJob = require("../models/SavedJob");

// upsert so saving twice is idempotent rather than a duplicate-key error
const save = (userId, jobId) =>
  SavedJob.findOneAndUpdate(
    { userId, jobId },
    { userId, jobId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const unsave = (userId, jobId) => SavedJob.findOneAndDelete({ userId, jobId });

const findAllByUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    SavedJob.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SavedJob.countDocuments({ userId }),
  ]);

  return { rows, total };
};

/**
 * Which of these job ids has the user saved?
 * One query for a whole page of results, instead of one per card.
 */
const findSavedIds = async (userId, jobIds) => {
  const rows = await SavedJob.find({ userId, jobId: { $in: jobIds } }).select("jobId");
  return rows.map((r) => String(r.jobId));
};

module.exports = { save, unsave, findAllByUser, findSavedIds };