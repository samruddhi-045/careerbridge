const { z } = require("zod");

const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Enter a company name").max(120, "Name is too long"),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  location: z
    .object({
      city: z.string().trim().max(80).optional().or(z.literal("")),
      country: z.string().trim().max(80).optional().or(z.literal("")),
    })
    .optional(),
  socials: z
    .object({
      linkedin: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
      twitter: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
    })
    .optional(),
});

// same shape, every field optional — used for PATCH
const updateCompanySchema = createCompanySchema.partial();

const joinCompanySchema = z.object({
  companyId: z.string().trim().min(1, "companyId is required"),
});

module.exports = { createCompanySchema, updateCompanySchema, joinCompanySchema };
