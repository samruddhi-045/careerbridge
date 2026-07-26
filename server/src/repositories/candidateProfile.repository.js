const CandidateProfile = require("../models/CandidateProfile");

const findByUserId = (userId) => CandidateProfile.findOne({ userId });

const create = (userId, data) => CandidateProfile.create({ ...data, userId });

const update = (userId, data) =>
  CandidateProfile.findOneAndUpdate({ userId }, data, { new: true, runValidators: true });

const remove = (userId) => CandidateProfile.findOneAndDelete({ userId });

module.exports = { findByUserId, create, update, remove };
