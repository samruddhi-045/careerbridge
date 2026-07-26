const profileRepo = require("../repositories/candidateProfile.repository");
const AppError = require("../utils/AppError");

const getMyProfile = async (userId) => {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) throw new AppError("Profile not created yet", 404);
  return profile;
};

const createMyProfile = async (userId, data) => {
  const existing = await profileRepo.findByUserId(userId);
  if (existing) throw new AppError("Profile already exists, use update instead", 409);
  return profileRepo.create(userId, data);
};

const updateMyProfile = async (userId, data) => {
  const profile = await profileRepo.update(userId, data);
  if (!profile) throw new AppError("Profile not created yet", 404);
  return profile;
};

const deleteMyProfile = async (userId) => {
  const profile = await profileRepo.remove(userId);
  if (!profile) throw new AppError("Profile not created yet", 404);
};

// used by recruiters to view a specific candidate's profile
const getProfileByUserId = async (userId) => {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) throw new AppError("Profile not found", 404);
  return profile;
};

module.exports = { getMyProfile, createMyProfile, updateMyProfile, deleteMyProfile, getProfileByUserId };
