const analyticsRepo = require("../repositories/analytics.repository");
const AppError = require("../utils/AppError");

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

/**
 * Interpretation is part of the payload, not an afterthought.
 *
 * "Response rate: 23%" tells a candidate nothing on its own -- they can't
 * know whether that's good. A one-line read turns a number into something
 * they can act on, and it belongs on the server so the same wording is used
 * everywhere the metric appears.
 */
const readResponseRate = (rate, total) => {
  if (total < 5) return "Too early to read much into this — apply to a few more roles.";
  if (rate >= 40) return "Well above average. Your resume is landing.";
  if (rate >= 20) return "Around typical for most job searches.";
  if (rate >= 10) return "On the low side. Worth tightening your resume to the roles you're targeting.";
  return "Low. Try applying to fewer roles that fit you more closely.";
};

const getCandidateOverview = async (user) => {
  const [funnel, response, resumes, activity] = await Promise.all([
    analyticsRepo.candidateFunnel(user._id),
    analyticsRepo.candidateResponseStats(user._id),
    analyticsRepo.candidateResumePerformance(user._id),
    analyticsRepo.candidateActivity(user._id),
  ]);

  const total = response.total;
  const responseRate = pct(response.responded, total);

  return {
    totals: {
      applications: total,
      responseRate,
      medianDaysToResponse: response.medianDaysToResponse,
      interviews: funnel.interview || 0,
      offers: funnel.offer || 0,
    },
    // Ordered, so the client renders a funnel rather than guessing at key order
    funnel: ["applied", "screening", "interview", "offer", "hired"].map((stage) => ({
      stage,
      count: funnel[stage] || 0,
      // Percentage of ALL applications, so bars shrink left to right
      percent: pct(funnel[stage] || 0, total),
    })),
    resumes: resumes.map((r) => ({
      id: r._id,
      name: r.name || "Untitled resume",
      applications: r.applications,
      responses: r.responses,
      interviews: r.interviews,
      responseRate: pct(r.responses, r.applications),
    })),
    activity: activity.map((a) => ({ week: a._id, count: a.count })),
    insight: readResponseRate(responseRate, total),
  };
};

// ---------- recruiter ----------

const requireCompany = (user) => {
  if (!user.companyId) throw new AppError("Join a company to see analytics", 403);
  return user.companyId;
};

/**
 * Flags the stage where candidates wait longest.
 * A hiring team can act on "screening is your bottleneck" in a way they
 * can't act on a table of five numbers.
 */
const findBottleneck = (timeInStage) => {
  const entries = Object.entries(timeInStage).filter(
    ([stage]) => !["hired", "rejected", "withdrawn"].includes(stage)
  );
  if (!entries.length) return null;

  const [stage, data] = entries.reduce((worst, cur) =>
    cur[1].medianDays > worst[1].medianDays ? cur : worst
  );

  if (data.medianDays < 3) return null; // nothing worth flagging
  return { stage, medianDays: data.medianDays };
};

const getRecruiterOverview = async (user, jobId) => {
  const companyId = requireCompany(user);

  const [pipeline, timeInStage, jobs, activity] = await Promise.all([
    analyticsRepo.companyPipeline(companyId, jobId),
    analyticsRepo.companyTimeInStage(companyId, jobId),
    analyticsRepo.companyJobPerformance(companyId),
    analyticsRepo.companyActivity(companyId),
  ]);

  const total = Object.values(pipeline).reduce((n, c) => n + c, 0);
  const active = ["applied", "screening", "interview", "offer"].reduce(
    (n, s) => n + (pipeline[s] || 0),
    0
  );

  return {
    totals: {
      applications: total,
      active,
      hired: pipeline.hired || 0,
      rejected: pipeline.rejected || 0,
      withdrawn: pipeline.withdrawn || 0,
    },
    pipeline: ["applied", "screening", "interview", "offer", "hired"].map((stage) => ({
      stage,
      count: pipeline[stage] || 0,
    })),
    timeInStage: ["applied", "screening", "interview", "offer"].map((stage) => ({
      stage,
      medianDays: timeInStage[stage]?.medianDays ?? null,
      sampleSize: timeInStage[stage]?.count ?? 0,
    })),
    jobs: jobs.map((j) => ({
      id: j._id,
      title: j.title || "Deleted job",
      status: j.status,
      applications: j.applications,
      interviews: j.interviews,
      hires: j.hires,
      interviewRate: pct(j.interviews, j.applications),
      avgDaysToHire: j.avgDaysToHire,
    })),
    activity: activity.map((a) => ({ week: a._id, count: a.count })),
    bottleneck: findBottleneck(timeInStage),
  };
};

module.exports = { getCandidateOverview, getRecruiterOverview };