const mongoose = require("mongoose");

// one company can have many recruiters (User.companyId points here); the recruiter
// who creates it becomes that company's company_admin, see company.service.js
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    website: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "1-10",
    },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    location: {
      city: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },
    socials: {
      linkedin: { type: String, trim: true, default: "" },
      twitter: { type: String, trim: true, default: "" },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // flips to true once a platform_admin reviews it, not used for access control yet
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
