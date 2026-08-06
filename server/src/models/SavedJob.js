const mongoose = require("mongoose");

/**
 * A candidate's shortlist. Deliberately its own collection rather than an
 * array on the user: a savedJobs array would grow unbounded on the User
 * document and every auth lookup would drag it along.
 */
const savedJobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  },
  { timestamps: true }
);

// Saving twice is a no-op, not an error. The unique index is the real guard --
// an app-level "did they already save this" check races with itself when a
// user double-clicks.
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// "My saved jobs", newest first
savedJobSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SavedJob", savedJobSchema);