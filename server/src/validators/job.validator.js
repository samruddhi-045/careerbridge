const { z } = require("zod");
const {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  EXPERIENCE_LEVELS,
  CURRENCIES,
  SALARY_PERIODS,
} = require("../models/Job");

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(""));
const bulletList = (max, cap) =>
  z.array(z.string().trim().min(1).max(max)).max(cap).optional();

const salarySchema = z
  .object({
    min: z.number().min(0).nullable().optional(),
    max: z.number().min(0).nullable().optional(),
    currency: z.enum(CURRENCIES).optional(),
    period: z.enum(SALARY_PERIODS).optional(),
    isVisible: z.boolean().optional(),
  })
  // A range where max < min is a typo, and it would silently break salary
  // filtering later. Catch it at the door.
  .refine((s) => s.min == null || s.max == null || s.max >= s.min, {
    message: "Maximum salary must be at least the minimum",
    path: ["max"],
  });

const jobBody = {
  description: optionalText(5000),
  responsibilities: bulletList(300, 20),
  requirements: bulletList(300, 20),
  niceToHaves: bulletList(300, 15),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  location: z
    .object({
      city: optionalText(80),
      country: optionalText(80),
    })
    .optional(),
  salary: salarySchema.optional(),
  openings: z.number().int().min(1).max(999).optional(),
  closesAt: z.coerce.date().nullable().optional(),
};

const createJobSchema = z.object({
  title: z.string({ error: "Enter a job title" }).trim().min(3, "Enter a job title").max(120),
  // The only status a client may set at creation: publish now, or save a draft.
  // Every other transition goes through PATCH /:id/status.
  status: z.enum(["draft", "published"]).optional(),
  ...jobBody,
});

// everything optional so PATCH can send a single changed field
const updateJobSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title").max(120).optional(),
  ...jobBody,
});

const changeStatusSchema = z.object({
  status: z.enum(["draft", "published", "closed", "archived"], {
    error: "Pick a valid status",
  }),
});

module.exports = { createJobSchema, updateJobSchema, changeStatusSchema };