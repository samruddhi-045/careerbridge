const Resume = require("../models/Resume");

/**
 * Every query here is scoped by userId, not just by _id.
 *
 * This is deliberate and it's the security model for this whole resource:
 * a request for someone else's resume doesn't fail an ownership CHECK, it
 * simply matches no document. There's no check to forget, and the response is
 * a 404 that doesn't confirm the other resume exists.
 */
const findAllByUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  // Both queries run against the same filter; Promise.all so the count doesn't
  // wait for the page fetch.
  const [items, total] = await Promise.all([
    Resume.find({ userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Resume.countDocuments({ userId }),
  ]);

  return { items, total };
};

const findOneByUser = (id, userId) => Resume.findOne({ _id: id, userId });

const countByUser = (userId) => Resume.countDocuments({ userId });

const create = (userId, data) => Resume.create({ ...data, userId });

const update = (id, userId, data) =>
  Resume.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true });

const remove = (id, userId) => Resume.findOneAndDelete({ _id: id, userId });

module.exports = { findAllByUser, findOneByUser, countByUser, create, update, remove };