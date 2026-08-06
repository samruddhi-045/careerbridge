const Job = require("../models/Job");

/**
 * Builds the mongo filter from query params.
 * Only ever matches published jobs -- drafts, closed and archived roles are
 * invisible to candidates no matter what else is passed.
 */
const buildFilter = ({ workMode, employmentType, experienceLevel, city, salaryMin, skills }) => {
  const filter = { status: "published" };

  // Arrays come in as comma-separated strings: ?workMode=remote,hybrid
  const list = (v) => (Array.isArray(v) ? v : String(v).split(",").filter(Boolean));

  if (workMode) filter.workMode = { $in: list(workMode) };
  if (employmentType) filter.employmentType = { $in: list(employmentType) };
  if (experienceLevel) filter.experienceLevel = { $in: list(experienceLevel) };
  if (city) filter["location.city"] = { $regex: `^${city.trim()}`, $options: "i" };
  if (skills) filter.skills = { $in: list(skills).map((s) => new RegExp(`^${s}$`, "i")) };

  /**
   * "Pays at least X" means the job's MAXIMUM must reach X -- a role offering
   * 3-5 lakh does qualify for a "min 4 lakh" filter, because 5 is on the table.
   * Filtering on salary.min would wrongly exclude it.
   */
  if (salaryMin) filter["salary.max"] = { $gte: Number(salaryMin) };

  return filter;
};

/**
 * Two query paths on purpose.
 *
 * WITH a keyword: $text search, sorted by relevance score. Mongo's text index
 * handles stemming and multi-word queries, and the field weights on the index
 * rank a title match above a passing mention in the description.
 *
 * WITHOUT one: a plain filter sorted by publishedAt. Running $text with an
 * empty string is invalid, and sorting by relevance is meaningless when there's
 * nothing to be relevant to.
 */
const search = async (params) => {
  const { q, page = 1, limit = 20, sort } = params;
  const filter = buildFilter(params);
  const skip = (page - 1) * limit;

  const keyword = q?.trim();
  let query;
  let sortSpec;

  if (keyword) {
    filter.$text = { $search: keyword };
    // Relevance unless the user explicitly asked for newest
    sortSpec = sort === "recent" ? { publishedAt: -1 } : { score: { $meta: "textScore" } };
    query = Job.find(filter, { score: { $meta: "textScore" } });
  } else {
    sortSpec = { publishedAt: -1 };
    query = Job.find(filter);
  }

  const [items, total] = await Promise.all([
    query
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .populate("companyId", "name slug logoUrl industry location"),
    Job.countDocuments(filter),
  ]);

  return { items, total };
};

// Only published jobs are viewable. A closed job returns 404 rather than a
// dead page -- see the service for why closed is handled separately.
const findPublishedById = (id) =>
  Job.findOne({ _id: id, status: { $in: ["published", "closed"] } }).populate(
    "companyId",
    "name slug logoUrl industry website description location size"
  );

const findManyByIds = (ids) =>
  Job.find({ _id: { $in: ids } }).populate("companyId", "name slug logoUrl");

module.exports = { search, findPublishedById, findManyByIds };