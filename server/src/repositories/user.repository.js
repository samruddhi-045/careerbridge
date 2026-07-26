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

module.exports = { findByEmail, findById, create, touchLastLogin };