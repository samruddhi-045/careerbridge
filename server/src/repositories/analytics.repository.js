const Application = require("../models/Application");
const mongoose = require("mongoose");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * All of these read from statusHistory rather than the current `status` field.
 *
 * "How long did candidates sit in screening" and "how many reached interview
 * but never got an offer" are not answerable from a single current-status
 * value -- you need the trail. This is why the history array went in when
 * applications were built rather than being deferred.
 *
 * Everything computes on read. At a few thousand documents an aggregation
 * returns in milliseconds, and a precomputed summary collection would add
 * staleness for no benefit. If it ever gets slow, caching goes here and
 * nothing above this layer changes.
 */

// ---------- candidate ----------

/**
 * Counts of applications that EVER reached each stage, not where they sit now.
 *
 * A candidate currently at "offer" also passed through screening and
 * interview. Counting current status would show 1 offer and 0 interviews,
 * which reads as a broken funnel.
 */
const candidateFunnel = async (candidateId) => {
  const rows = await Application.aggregate([
    { $match: { candidateId: oid(candidateId) } },
    { $project: { reached: "$statusHistory.status" } },
    { $unwind: "$reached" },
    { $group: { _id: "$reached", count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

/**
 * How many applications got any response at all, and how quickly.
 *
 * "Response" means the recruiter moved it off `applied` -- to screening, or
 * to rejected. A rejection is still a response; being ignored is the thing
 * candidates actually hate.
 */
const candidateResponseStats = async (candidateId) => {
  const rows = await Application.aggregate([
    { $match: { candidateId: oid(candidateId) } },
    {
      $project: {
        createdAt: 1,
        // statusHistory[0] is always "applied", so [1] is the first real move
        firstResponse: { $arrayElemAt: ["$statusHistory", 1] },
      },
    },
    {
      $project: {
        responded: { $cond: [{ $ifNull: ["$firstResponse", false] }, 1, 0] },
        daysToRespond: {
          $cond: [
            { $ifNull: ["$firstResponse", false] },
            {
              $divide: [
                { $subtract: ["$firstResponse.changedAt", "$createdAt"] },
                1000 * 60 * 60 * 24,
              ],
            },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        responded: { $sum: "$responded" },
        // $push then filter in JS -- $median needs Mongo 7, and this dataset
        // is small enough that it doesn't matter
        days: { $push: "$daysToRespond" },
      },
    },
  ]);

  if (!rows.length) return { total: 0, responded: 0, medianDaysToResponse: null };

  const { total, responded, days } = rows[0];
  const valid = days.filter((d) => d != null).sort((a, b) => a - b);

  return {
    total,
    responded,
    medianDaysToResponse: valid.length
      ? Math.round(valid[Math.floor(valid.length / 2)] * 10) / 10
      : null,
  };
};

/**
 * Which resume actually performs.
 *
 * The snapshot carries resumeId, so this survives the candidate renaming or
 * deleting the original -- the name is taken from the snapshot too.
 */
const candidateResumePerformance = async (candidateId) => {
  return Application.aggregate([
    { $match: { candidateId: oid(candidateId) } },
    {
      $project: {
        resumeId: "$resumeSnapshot.resumeId",
        resumeName: "$resumeSnapshot.name",
        responded: { $cond: [{ $gt: [{ $size: "$statusHistory" }, 1] }, 1, 0] },
        interviewed: {
          $cond: [{ $in: ["interview", "$statusHistory.status"] }, 1, 0],
        },
      },
    },
    {
      $group: {
        _id: "$resumeId",
        name: { $first: "$resumeName" },
        applications: { $sum: 1 },
        responses: { $sum: "$responded" },
        interviews: { $sum: "$interviewed" },
      },
    },
    { $sort: { applications: -1 } },
    { $limit: 10 },
  ]);
};

/** Applications per week for the last 12 weeks. */
const candidateActivity = async (candidateId, weeks = 12) => {
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  return Application.aggregate([
    { $match: { candidateId: oid(candidateId), createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: { $dateTrunc: { date: "$createdAt", unit: "week" } } } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ---------- recruiter ----------

/** Where every applicant to this company sits right now, per job. */
const companyPipeline = async (companyId, jobId) => {
  const match = { companyId: oid(companyId) };
  if (jobId) match.jobId = oid(jobId);

  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

/**
 * Median days spent in each stage.
 *
 * Computed from consecutive statusHistory entries: the gap between entering
 * "screening" and entering whatever came next IS the time in screening. This
 * is the number that tells a hiring team where they're actually slow --
 * "candidates wait 9 days in screening" is a fixable problem in a way that
 * "hiring takes a while" isn't.
 *
 * Applications still sitting in a stage are excluded: they have no exit
 * timestamp yet, and counting them as zero would flatter the numbers.
 */
const companyTimeInStage = async (companyId, jobId) => {
  const match = { companyId: oid(companyId) };
  if (jobId) match.jobId = oid(jobId);

  const rows = await Application.aggregate([
    { $match: match },
    {
      $project: {
        // pair each history entry with the one after it
        pairs: {
          $map: {
            input: { $range: [0, { $subtract: [{ $size: "$statusHistory" }, 1] }] },
            as: "i",
            in: {
              stage: { $arrayElemAt: ["$statusHistory.status", "$$i"] },
              enteredAt: { $arrayElemAt: ["$statusHistory.changedAt", "$$i"] },
              leftAt: { $arrayElemAt: ["$statusHistory.changedAt", { $add: ["$$i", 1] }] },
            },
          },
        },
      },
    },
    { $unwind: "$pairs" },
    {
      $project: {
        stage: "$pairs.stage",
        days: {
          $divide: [{ $subtract: ["$pairs.leftAt", "$pairs.enteredAt"] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    { $group: { _id: "$stage", days: { $push: "$days" }, count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, r) => {
    const sorted = r.days.sort((a, b) => a - b);
    return {
      ...acc,
      [r._id]: {
        medianDays: Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10,
        count: r.count,
      },
    };
  }, {});
};

/** Per-job funnel: received, reached interview, hired, and how long it took. */
const companyJobPerformance = async (companyId) => {
  return Application.aggregate([
    { $match: { companyId: oid(companyId) } },
    {
      $project: {
        jobId: 1,
        createdAt: 1,
        reachedInterview: { $cond: [{ $in: ["interview", "$statusHistory.status"] }, 1, 0] },
        hired: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
        // when they were hired, for time-to-hire
        hiredAt: {
          $let: {
            vars: {
              ev: {
                $first: {
                  $filter: { input: "$statusHistory", as: "e", cond: { $eq: ["$$e.status", "hired"] } },
                },
              },
            },
            in: "$$ev.changedAt",
          },
        },
      },
    },
    {
      $project: {
        jobId: 1,
        reachedInterview: 1,
        hired: 1,
        daysToHire: {
          $cond: [
            { $ifNull: ["$hiredAt", false] },
            { $divide: [{ $subtract: ["$hiredAt", "$createdAt"] }, 1000 * 60 * 60 * 24] },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$jobId",
        applications: { $sum: 1 },
        interviews: { $sum: "$reachedInterview" },
        hires: { $sum: "$hired" },
        avgDaysToHire: { $avg: "$daysToHire" },
      },
    },
    { $sort: { applications: -1 } },
    { $limit: 20 },
    {
      $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" },
    },
    {
      $project: {
        applications: 1,
        interviews: 1,
        hires: 1,
        avgDaysToHire: { $round: ["$avgDaysToHire", 1] },
        title: { $first: "$job.title" },
        status: { $first: "$job.status" },
      },
    },
  ]);
};

/** Applications received per week across the company. */
const companyActivity = async (companyId, weeks = 12) => {
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  return Application.aggregate([
    { $match: { companyId: oid(companyId), createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: { $dateTrunc: { date: "$createdAt", unit: "week" } } } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = {
  candidateFunnel,
  candidateResponseStats,
  candidateResumePerformance,
  candidateActivity,
  companyPipeline,
  companyTimeInStage,
  companyJobPerformance,
  companyActivity,
};