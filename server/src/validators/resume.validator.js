const { z } = require("zod");
const { SECTIONS } = require("../models/Resume");

// Reused everywhere a URL is optional: accepts a real URL or an empty string,
// so a cleared input doesn't fail validation.
const optionalUrl = z.string().trim().url("Enter a valid URL").optional().or(z.literal(""));
const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(""));

const bullets = z.array(z.string().trim().min(1).max(400)).max(12).optional();

// NOTE: zod 4 renamed `required_error` to `error`. Using the old key means a
// MISSING field falls back to zod's generic message instead of yours.
const experienceSchema = z.object({
  title: z.string({ error: "Job title is required" }).trim().min(1, "Job title is required").max(120),
  company: z.string({ error: "Company is required" }).trim().min(1, "Company is required").max(120),
  location: optionalText(120),
  startDate: z.coerce.date({ error: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(), // null/omitted = current role
  bullets,
});

const projectSchema = z.object({
  name: z.string({ error: "Project name is required" }).trim().min(1, "Project name is required").max(120),
  description: optionalText(500),
  url: optionalUrl,
  techStack: z.array(z.string().trim().max(40)).max(20).optional(),
  bullets,
});

const educationSchema = z.object({
  school: z.string({ error: "School is required" }).trim().min(1, "School is required").max(120),
  degree: optionalText(120),
  fieldOfStudy: optionalText(120),
  startDate: z.coerce.date({ error: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(),
  grade: optionalText(40),
});

const skillGroupSchema = z.object({
  category: z.string({ error: "Category is required" }).trim().min(1, "Category is required").max(60),
  items: z.array(z.string().trim().min(1).max(40)).max(40).optional(),
});

const certificationSchema = z.object({
  name: z.string({ error: "Certification name is required" }).trim().min(1, "Certification name is required").max(140),
  issuer: optionalText(120),
  issueDate: z.coerce.date().nullable().optional(),
  url: optionalUrl,
});

const contactSchema = z.object({
  fullName: optionalText(80),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: optionalText(30),
  location: optionalText(120),
  links: z
    .array(z.object({ label: z.string().trim().min(1).max(60), url: z.string().trim().url("Enter a valid URL") }))
    .max(8)
    .optional(),
});

// Array caps everywhere: a MongoDB document maxes out at 16MB, and unbounded
// arrays are how you find that limit in production.
const resumeBody = {
  templateId: z.string().trim().max(40).optional(),
  contact: contactSchema.optional(),
  summary: optionalText(1200),
  experience: z.array(experienceSchema).max(20).optional(),
  projects: z.array(projectSchema).max(20).optional(),
  education: z.array(educationSchema).max(10).optional(),
  skills: z.array(skillGroupSchema).max(10).optional(),
  certifications: z.array(certificationSchema).max(20).optional(),
  // Must be one of the known sections — an unknown string here would silently
  // drop a section from every template.
  sectionOrder: z.array(z.enum(SECTIONS)).max(SECTIONS.length).optional(),
};

const createResumeSchema = z.object({
  name: z.string({ error: "Give this resume a name" }).trim().min(1, "Give this resume a name").max(100),
  prefillFromProfile: z.boolean().optional().default(false),
  ...resumeBody,
});

// Everything optional so PATCH can send a single changed section.
const updateResumeSchema = z.object({
  name: z.string().trim().min(1, "Give this resume a name").max(100).optional(),
  ...resumeBody,
});

module.exports = { createResumeSchema, updateResumeSchema };