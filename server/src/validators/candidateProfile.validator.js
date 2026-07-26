const { z } = require("zod");

const experienceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  company: z.string().trim().min(1, "Company is required").max(120),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  startDate: z.coerce.date({ required_error: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(), // null/omitted = currently working here
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

const educationSchema = z.object({
  school: z.string().trim().min(1, "School is required").max(120),
  degree: z.string().trim().max(120).optional().or(z.literal("")),
  fieldOfStudy: z.string().trim().max(120).optional().or(z.literal("")),
  startDate: z.coerce.date({ required_error: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(),
});

const portfolioLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  url: z.string().trim().url("Enter a valid URL"),
});

// shared by create (POST) and update (PATCH) — everything's optional so PATCH can send partial data
const candidateProfileSchema = z.object({
  headline: z.string().trim().max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z
    .object({
      city: z.string().trim().max(80).optional().or(z.literal("")),
      country: z.string().trim().max(80).optional().or(z.literal("")),
    })
    .optional(),
  skills: z.array(z.string().trim().max(40)).max(50).optional(),
  resumeUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  openToWork: z.boolean().optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  portfolioLinks: z.array(portfolioLinkSchema).optional(),
});

module.exports = { candidateProfileSchema };
