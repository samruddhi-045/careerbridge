const mongoose = require("mongoose");

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "temporary"];
const WORK_MODES = ["onsite", "hybrid", "remote"];
const EXPERIENCE_LEVELS = ["internship", "entry", "mid", "senior", "lead"];
const JOB_STATUSES = ["draft", "published", "closed", "archived"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const SALARY_PERIODS = ["yearly", "monthly", "hourly"];

/**
 * Salary is a RANGE with a currency and a period, never a bare number.
 * "50000" is meaningless on its own -- is that rupees a month or dollars a
 * year? And salary range is one of the first things candidates filter on, so
 * min/max have to be queryable numbers rather than text.
 */
const salarySchema = new mongoose.Schema(
  {
    min: { type: Number, min: 0, default: null },
    max: { type: Number, min: 0, default: null },
    currency: { type: String, enum: CURRENCIES, default: "INR" },
    period: { type: String, enum: SALARY_PERIODS, default: "yearly" },
    // Plenty of postings hide pay. We still store it for internal filtering.
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    /**
     * A job belongs to the COMPANY, not the recruiter who typed it.
     * If that recruiter leaves, the job and its applicants stay with the
     * company. postedBy records who wrote it; companyId decides who can touch
     * it -- and every query is scoped on companyId, so cross-company access
     * isn't a check that can be forgotten.
     */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },

    // Short pitch. The structured arrays below carry the detail.
    description: { type: String, trim: true, maxlength: 5000, default: "" },

    /**
     * Structured rather than one rich-text blob, because Phase 4 compares a
     * resume against a job description. "Does this candidate meet the
     * requirements" is answerable when requirements are a list; it isn't when
     * they're buried in prose the recruiter pasted from Word.
     */
    responsibilities: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
    requirements: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
    niceToHaves: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },

    skills: { type: [{ type: String, trim: true, maxlength: 40 }], default: [], index: true },

    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: "full_time", index: true },
    workMode: { type: String, enum: WORK_MODES, default: "onsite", index: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "entry", index: true },

    location: {
      city: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },

    salary: { type: salarySchema, default: () => ({}) },

    openings: { type: Number, min: 1, default: 1 },

    /**
     * draft     -- being written, invisible to candidates
     * published -- live and searchable
     * closed    -- no longer accepting applications, existing ones stay
     * archived  -- hidden from the recruiter's active list too
     */
    status: { type: String, enum: JOB_STATUSES, default: "draft", index: true },

    // Set the first time status becomes "published". Search sorts on this --
    // createdAt would rank a long-lived draft above a fresh posting.
    publishedAt: { type: Date, default: null },

    // Optional deadline. A published job past this date stops accepting applications.
    closesAt: { type: Date, default: null },

    // Denormalised counter, incremented on apply. Avoids a countDocuments per
    // job when rendering a list of twenty jobs.
    applicationCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/**
 * Text index for keyword search. Weights make a title match rank above a
 * mention buried in the description -- searching "react" should surface
 * "React Developer" before a backend job that says "our frontend uses React".
 */
jobSchema.index(
  { title: "text", description: "text", skills: "text" },
  { weights: { title: 10, skills: 5, description: 1 }, name: "job_search_index" }
);

// The recruiter's "my jobs" list: this company's jobs, newest first.
jobSchema.index({ companyId: 1, status: 1, createdAt: -1 });

// The candidate-facing search: published jobs, newest published first.
jobSchema.index({ status: 1, publishedAt: -1 });

/** Card-sized payload for search results and list screens. */
jobSchema.methods.toCardJSON = function () {
  return {
    id: this._id,
    title: this.title,
    companyId: this.companyId,
    location: this.location,
    employmentType: this.employmentType,
    workMode: this.workMode,
    experienceLevel: this.experienceLevel,
    salary: this.salary?.isVisible ? this.salary : null,
    skills: this.skills.slice(0, 6),
    status: this.status,
    applicationCount: this.applicationCount,
    publishedAt: this.publishedAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Job", jobSchema);
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.WORK_MODES = WORK_MODES;
module.exports.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
module.exports.JOB_STATUSES = JOB_STATUSES;
module.exports.CURRENCIES = CURRENCIES;
module.exports.SALARY_PERIODS = SALARY_PERIODS;