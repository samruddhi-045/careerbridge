const mongoose = require("mongoose");

// Sections are stored as structured arrays, not blobs of text, so Phase 4's AI
// features can rewrite a single bullet without touching the rest.

const bulletList = {
  type: [{ type: String, trim: true, maxlength: 400 }],
  default: [],
};

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 120 },
    company: { type: String, trim: true, required: true, maxlength: 120 },
    location: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = current role. No separate
    bullets: bulletList,                    // "current" flag: two fields for one
  },                                        // fact always drift apart.
  { _id: true }
);

// Projects are first-class, not an afterthought — for a candidate with little
// work history this is the section that carries the resume.
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    url: { type: String, trim: true, default: "" },
    techStack: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
    bullets: bulletList,
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
    grade: { type: String, trim: true, maxlength: 40, default: "" },
  },
  { _id: true }
);

// Grouped rather than a flat list, because that's how resumes actually present
// skills: "Languages: JavaScript, Python". A flat list can be modelled as one
// group; a grouped list can't be recovered from a flat one.
const skillGroupSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true, required: true, maxlength: 60 },
    items: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 140 },
    issuer: { type: String, trim: true, default: "" },
    issueDate: { type: Date, default: null },
    url: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true, maxlength: 60 },
    url: { type: String, trim: true, required: true },
  },
  { _id: true }
);

const SECTIONS = ["summary", "experience", "projects", "education", "skills", "certifications"];

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // The candidate's own label for this resume, e.g. "Frontend - product companies"
    name: { type: String, trim: true, required: true, maxlength: 100 },

    templateId: { type: String, trim: true, default: "classic" },

    contact: {
      fullName: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      location: { type: String, trim: true, default: "" },
      links: { type: [linkSchema], default: [] },
    },

    summary: { type: String, trim: true, maxlength: 1200, default: "" },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    skills: { type: [skillGroupSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },

    // Which section goes first is the CANDIDATE's decision (projects above
    // experience for a junior), so it lives on the resume. How a section LOOKS
    // is the template's decision. Keeping these separate means reordering
    // doesn't require forking a template.
    sectionOrder: {
      type: [{ type: String, enum: SECTIONS }],
      default: SECTIONS,
    },
  },
  { timestamps: true }
);

// The list screen sorts by most-recently-edited, scoped to one user.
resumeSchema.index({ userId: 1, updatedAt: -1 });

// Only the fields the list screen needs. Sending full resume JSON for ten
// resumes to render six names is wasted payload.
resumeSchema.methods.toListJSON = function () {
  return {
    id: this._id,
    name: this.name,
    templateId: this.templateId,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Resume", resumeSchema);
module.exports.SECTIONS = SECTIONS;