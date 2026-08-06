const crypto = require("crypto");

const companyRepo = require("../repositories/company.repository");
const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// appends a short random suffix if the plain slug is taken, so two "Acme Inc" signups don't collide
const uniqueSlug = async (name) => {
  const base = slugify(name) || "company";
  let slug = base;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!(await companyRepo.findBySlug(slug))) return slug;
    slug = `${base}-${crypto.randomBytes(2).toString("hex")}`;
  }

  // Previously this gave up and returned a slug that might already be taken,
  // surfacing as a confusing "already exists" error. Failing loudly is better.
  throw new AppError("Couldn't generate a unique company URL. Try a different name.", 409);
};

/**
 * Invite codes: 12 hex characters, uppercase. Random enough that guessing is
 * not a realistic attack (16^12 combinations), short enough to paste into Slack.
 *
 * Stored in plain text rather than hashed, because the company_admin has to be
 * able to read it back to share it. That's the accepted trade for a shared,
 * rotatable, low-value secret -- unlike a password it grants only "join this
 * company", and it can be regenerated instantly if it leaks.
 */
const generateInviteCode = () => crypto.randomBytes(6).toString("hex").toUpperCase();

// a recruiter creates a brand new company and becomes its company_admin
const createCompany = async (user, data) => {
  if (user.companyId) {
    throw new AppError("You're already part of a company", 409);
  }

  const slug = await uniqueSlug(data.name);
  const company = await companyRepo.create({
    ...data,
    slug,
    inviteCode: generateInviteCode(),
    createdBy: user._id,
  });
  const updatedUser = await userRepo.setCompany(user._id, company._id, "company_admin");

  return { company, user: updatedUser };
};

/**
 * Joining requires the company's invite code.
 *
 * Previously this took a company id from the URL, which meant any recruiter
 * could join ANY company -- and /companies/search hands out the ids. Once
 * companies own jobs and applications, that's a cross-company data leak.
 * Holding the code means someone deliberately gave it to you.
 */
const joinCompany = async (user, code) => {
  if (user.companyId) {
    throw new AppError("You're already part of a company", 409);
  }

  const company = await companyRepo.findByInviteCode(code);
  // One vague message whether the code is wrong or simply doesn't exist, so
  // this endpoint can't be used to probe for valid codes.
  if (!company) throw new AppError("That invite code isn't valid", 404);

  const updatedUser = await userRepo.setCompany(user._id, company._id);

  return { company, user: updatedUser };
};

const getCompany = async (id) => {
  const company = await companyRepo.findById(id);
  if (!company) throw new AppError("Company not found", 404);
  return company;
};

const getMyCompany = async (user) => {
  if (!user.companyId) throw new AppError("You're not part of a company yet", 404);
  return getCompany(user.companyId);
};

const searchCompanies = (q) => companyRepo.search(q || "");

// only a company_admin can edit their own company
const updateCompany = async (user, companyId, data) => {
  if (String(user.companyId) !== String(companyId)) {
    throw new AppError("You do not have access to this company", 403);
  }

  const company = await companyRepo.update(companyId, data);
  if (!company) throw new AppError("Company not found", 404);
  return company;
};

// company_admin only -- reading the code is what lets them share it
const getInviteCode = async (user) => {
  if (!user.companyId) throw new AppError("You're not part of a company yet", 404);

  const company = await companyRepo.findByIdWithInviteCode(user.companyId);
  if (!company) throw new AppError("Company not found", 404);

  // Companies created before invite codes existed won't have one yet.
  if (!company.inviteCode) {
    const updated = await companyRepo.setInviteCode(company._id, generateInviteCode());
    return updated.inviteCode;
  }

  return company.inviteCode;
};

// Rotating invalidates the old code -- the move after someone leaves the team
// or the code ends up somewhere public.
const regenerateInviteCode = async (user) => {
  if (!user.companyId) throw new AppError("You're not part of a company yet", 404);

  const company = await companyRepo.setInviteCode(user.companyId, generateInviteCode());
  if (!company) throw new AppError("Company not found", 404);

  return company.inviteCode;
};

module.exports = {
  createCompany,
  joinCompany,
  getCompany,
  getMyCompany,
  searchCompanies,
  updateCompany,
  getInviteCode,
  regenerateInviteCode,
};