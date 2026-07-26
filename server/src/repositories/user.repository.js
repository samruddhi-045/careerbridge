const User = require("../models/User");

// all the DB queries for users live here, services call these instead of
// using the User model directly
const findByEmail = (email, { withPassword = false } = {}) => {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  // passwordHash is select:false on the schema, so we have to ask for it here
  return withPassword ? query.select("+passwordHash") : query;
};

const findById = (id) => User.findById(id);

const create = (data) => User.create(data);

const touchLastLogin = (id) =>
  User.findByIdAndUpdate(id, { lastLoginAt: new Date() }, { new: true });

// --- email verification ---
const setEmailVerificationToken = (id, tokenHash, expires) =>
  User.findByIdAndUpdate(id, {
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: expires,
  });

const findByVerificationTokenHash = (tokenHash) =>
  User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

const markEmailVerified = (id) =>
  User.findByIdAndUpdate(
    id,
    {
      isEmailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    },
    { new: true }
  );

// --- password reset ---
const setPasswordResetToken = (id, tokenHash, expires) =>
  User.findByIdAndUpdate(id, { passwordResetTokenHash: tokenHash, passwordResetExpires: expires });

const findByResetTokenHash = (tokenHash) =>
  User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

const updatePassword = (id, passwordHash) =>
  User.findByIdAndUpdate(id, {
    passwordHash,
    passwordResetTokenHash: null,
    passwordResetExpires: null,
  });

// --- company onboarding ---
const setCompany = (id, companyId, role) =>
  User.findByIdAndUpdate(id, { companyId, ...(role ? { role } : {}) }, { new: true });

module.exports = {
  findByEmail,
  findById,
  create,
  touchLastLogin,
  setEmailVerificationToken,
  findByVerificationTokenHash,
  markEmailVerified,
  setPasswordResetToken,
  findByResetTokenHash,
  updatePassword,
  setCompany,
};