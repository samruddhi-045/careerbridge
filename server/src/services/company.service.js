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
  let attempt = 0;

  while (await companyRepo.findBySlug(slug)) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break; // extremely unlikely, but don't loop forever
  }

  return slug;
};

// a recruiter creates a brand new company and becomes its company_admin
const createCompany = async (user, data) => {
  if (user.companyId) {
    throw new AppError("You're already part of a company", 409);
  }

  const slug = await uniqueSlug(data.name);
  const company = await companyRepo.create({ ...data, slug, createdBy: user._id });
  const updatedUser = await userRepo.setCompany(user._id, company._id, "company_admin");

  return { company, user: updatedUser };
};

// a recruiter joins a company that a company_admin already created; role stays "recruiter"
const joinCompany = async (user, companyId) => {
  if (user.companyId) {
    throw new AppError("You're already part of a company", 409);
  }

  const company = await companyRepo.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

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

module.exports = { createCompany, joinCompany, getCompany, getMyCompany, searchCompanies, updateCompany };
