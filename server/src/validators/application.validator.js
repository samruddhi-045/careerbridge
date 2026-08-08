const { z } = require("zod");

const applySchema = z.object({
  resumeId: z
    .string({ error: "Pick a resume to apply with" })
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Pick a resume to apply with"),
  // Optional. Plenty of good candidates skip it, and requiring one is a
  // conversion killer on a junior-heavy platform.
  coverLetter: z.string().trim().max(5000, "Cover letter is too long").optional().or(z.literal("")),
});

const changeStatusSchema = z.object({
  status: z.enum(["screening", "interview", "offer", "hired", "rejected"], {
    error: "Pick a valid stage",
  }),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

module.exports = { applySchema, changeStatusSchema };