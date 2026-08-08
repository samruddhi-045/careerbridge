const mongoose = require("mongoose");

const STATUSES = ["applied", "screening", "interview", "offer", "hired", "rejected", "withdrawn"];

// Stages a candidate actively moves through. rejected/withdrawn are terminal
// and sit outside the funnel -- useful when computing drop-off in Phase 5.
const PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired"];

/**
 * A frozen copy of the resume as it was WHEN SUBMITTED.
 *
 * This looks like duplication, and it is -- deliberately. It's the same reason
 * an invoice stores the price paid rather than joining to the current product
 * price: the submitted resume is a different FACT from the resume, with a
 * different lifetime.
 *
 * Without it: a candidate applies Monday, rewrites that resume Friday, and the
 * recruiter opening the application next week sees something the candidate
 * never sent. Deleting a resume would also orphan every application made with
 * it. `strict: false` because a snapshot should keep whatever shape the resume
 * had, even after the Resume schema changes.
 */
const resumeSnapshotSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
    name: String,
    templateId: String,
    contact: Object,
    summary: String,
    experience: Array,
    projects: Array,
    education: Array,
    skills: Array,
    certifications: Array,
    sectionOrder: Array,
  },
  { _id: false, strict: false }
);

/**
 * Append-only log of every status change.
 *
 * Phase 5 wants "how long do candidates sit in screening" and "where does the
 * funnel leak" -- neither is computable from a single current-status field.
 * Recording it now costs nothing; adding it later means the history of every
 * existing application is gone for good.
 */
const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Denormalised from the job so recruiter queries don't need a join to
    // answer "applications to my company".
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    resumeSnapshot: { type: resumeSnapshotSchema, required: true },

    // One blob, not structured. Unlike a resume, a cover letter is written for
    // one job and never reused -- there's nothing to rewrite piece by piece.
    coverLetter: { type: String, trim: true, maxlength: 5000, default: "" },

    status: { type: String, enum: STATUSES, default: "applied", index: true },
    statusHistory: { type: [statusEventSchema], default: [] },

    // Recruiter-only scratchpad. Never returned to the candidate.
    recruiterNotes: { type: String, trim: true, maxlength: 2000, default: "", select: false },
  },
  { timestamps: true }
);

/**
 * One application per candidate per job -- enforced by the DATABASE, not an
 * app-level check. A double-clicked Apply button races an app-level check and
 * wins; it cannot race a unique index.
 */
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

// "My applications", newest first
applicationSchema.index({ candidateId: 1, createdAt: -1 });

// The recruiter's board: one job's applications grouped by stage
applicationSchema.index({ jobId: 1, status: 1, createdAt: -1 });

/** What the candidate sees about their own application. */
applicationSchema.methods.toCandidateJSON = function () {
  return {
    id: this._id,
    jobId: this.jobId,
    status: this.status,
    coverLetter: this.coverLetter,
    resumeName: this.resumeSnapshot?.name,
    // The history minus who did it -- a candidate doesn't need the recruiter's id
    timeline: this.statusHistory.map((e) => ({
      status: e.status,
      changedAt: e.changedAt,
    })),
    appliedAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Application", applicationSchema);
module.exports.STATUSES = STATUSES;
module.exports.PIPELINE_STAGES = PIPELINE_STAGES;