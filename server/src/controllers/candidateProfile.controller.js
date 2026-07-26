const profileService = require("../services/candidateProfile.service");
const catchAsync = require("../utils/catchAsync");

const getMyProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user._id);
  res.status(200).json({ success: true, data: { profile } });
});

const createMyProfile = catchAsync(async (req, res) => {
  const profile = await profileService.createMyProfile(req.user._id, req.body);
  res.status(201).json({ success: true, data: { profile }, message: "Profile created" });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const profile = await profileService.updateMyProfile(req.user._id, req.body);
  res.status(200).json({ success: true, data: { profile }, message: "Profile updated" });
});

const deleteMyProfile = catchAsync(async (req, res) => {
  await profileService.deleteMyProfile(req.user._id);
  res.status(200).json({ success: true, data: null, message: "Profile deleted" });
});

// recruiters/company_admins viewing a specific candidate's profile
const getProfileByUserId = catchAsync(async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.params.userId);
  res.status(200).json({ success: true, data: { profile } });
});

module.exports = { getMyProfile, createMyProfile, updateMyProfile, deleteMyProfile, getProfileByUserId };
