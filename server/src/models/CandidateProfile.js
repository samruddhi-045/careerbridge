const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 120 },
    company: { type: String, trim: true, required: true, maxlength: 120 },
    location: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = currently working here
    description: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, trim: true, required: true, maxlength: 120 },
    degree: { type: String, trim: true, default: "" },
    fieldOfStudy: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
  },
  { _id: true }
);

const portfolioLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true, maxlength: 60 },
    url: { type: String, trim: true, required: true },
  },
  { _id: true }
);

// one-to-one with User (userId), separate from User itself so auth stays lean
// and profile data can grow without touching the auth model
const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, maxlength: 140, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    phone: { type: String, trim: true, default: "" },
    location: {
      city: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },
    skills: [{ type: String, trim: true, maxlength: 40 }],
    resumeUrl: { type: String, trim: true, default: "" },
    openToWork: { type: Boolean, default: true },
    experience: [experienceSchema],
    education: [educationSchema],
    portfolioLinks: [portfolioLinkSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);
