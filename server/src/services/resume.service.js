const resumeRepo = require("../repositories/resume.repository");
const profileRepo = require("../repositories/candidateProfile.repository");
const AppError = require("../utils/AppError");

// A cap, because "how many resumes can one account create" is a real product
// question and the answer is never "unlimited". Also stops a script from
// filling the collection.
const MAX_RESUMES_PER_USER = 15;

/**
 * Maps a CandidateProfile onto resume shape. Lives on the server because the
 * server already holds the profile -- doing this in the browser costs an extra
 * round trip and duplicates the mapping in a second place.
 *
 * Note the deliberate translation: profile.bio becomes the summary, and
 * profile experience descriptions become a single bullet each. The profile is
 * a record; a resume is a pitch. They're allowed to diverge after this.
 */
const buildFromProfile = (user, profile) => {
  if (!profile) {
    return { contact: { fullName: user.fullName, email: user.email } };
  }

  return {
    contact: {
      fullName: user.fullName,
      email: user.email,
      phone: profile.phone || "",
      location: [profile.location?.city, profile.location?.country].filter(Boolean).join(", "),
      links: (profile.portfolioLinks || []).map((l) => ({ label: l.label, url: l.url })),
    },
    summary: profile.bio || "",
    experience: (profile.experience || []).map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location || "",
      startDate: e.startDate,
      endDate: e.endDate,
      bullets: e.description ? [e.description] : [],
    })),
    education: (profile.education || []).map((e) => ({
      school: e.school,
      degree: e.degree || "",
      fieldOfStudy: e.fieldOfStudy || "",
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    // A flat skills array becomes one group the candidate can rename or split.
    skills: profile.skills?.length ? [{ category: "Skills", items: profile.skills }] : [],
  };
};

const listResumes = async (userId, pagination) => {
  const { items, total } = await resumeRepo.findAllByUser(userId, pagination);
  return { items: items.map((r) => r.toListJSON()), total };
};

const getResume = async (id, userId) => {
  const resume = await resumeRepo.findOneByUser(id, userId);
  if (!resume) throw new AppError("Resume not found", 404);
  return resume;
};

const createResume = async (user, { name, prefillFromProfile, ...rest }) => {
  const count = await resumeRepo.countByUser(user._id);
  if (count >= MAX_RESUMES_PER_USER) {
    throw new AppError(`You can keep up to ${MAX_RESUMES_PER_USER} resumes. Delete one to add another.`, 409);
  }

  let seed = {};
  if (prefillFromProfile) {
    const profile = await profileRepo.findByUserId(user._id);
    seed = buildFromProfile(user, profile);
  } else {
    seed = { contact: { fullName: user.fullName, email: user.email } };
  }

  // Explicit fields in the request body win over the prefilled seed.
  return resumeRepo.create(user._id, { name, ...seed, ...rest });
};

const updateResume = async (id, userId, data) => {
  const resume = await resumeRepo.update(id, userId, data);
  if (!resume) throw new AppError("Resume not found", 404);
  return resume;
};

const deleteResume = async (id, userId) => {
  const resume = await resumeRepo.remove(id, userId);
  if (!resume) throw new AppError("Resume not found", 404);
};

const duplicateResume = async (userId, id) => {
  const count = await resumeRepo.countByUser(userId);
  if (count >= MAX_RESUMES_PER_USER) {
    throw new AppError(`You can keep up to ${MAX_RESUMES_PER_USER} resumes. Delete one to add another.`, 409);
  }

  const source = await resumeRepo.findOneByUser(id, userId);
  if (!source) throw new AppError("Resume not found", 404);

  // toObject() then strip the identity fields, so Mongoose generates fresh
  // _ids for the copy and every nested subdocument.
  const copy = source.toObject();
  delete copy._id;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.__v;

  return resumeRepo.create(userId, { ...copy, name: `${source.name} (copy)`.slice(0, 100) });
};

module.exports = { listResumes, getResume, createResume, updateResume, deleteResume, duplicateResume };