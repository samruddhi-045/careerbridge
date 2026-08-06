const Company = require("../models/Company");

const create = (data) => Company.create(data);

const findById = (id) => Company.findById(id);

const findBySlug = (slug) => Company.findOne({ slug });

// inviteCode is select:false on the schema, so it has to be asked for explicitly
const findByInviteCode = (code) => Company.findOne({ inviteCode: code }).select("+inviteCode");

const findByIdWithInviteCode = (id) => Company.findById(id).select("+inviteCode");

const setInviteCode = (id, inviteCode) =>
  Company.findByIdAndUpdate(id, { inviteCode }, { new: true }).select("+inviteCode");

// simple name search, newest first. Note this deliberately does NOT expose
// inviteCode -- search is open to any signed-in user.
const search = (q) =>
  Company.find({ name: { $regex: q, $options: "i" } })
    .select("name slug industry location size logoUrl")
    .sort({ createdAt: -1 })
    .limit(10);

const update = (id, data) => Company.findByIdAndUpdate(id, data, { new: true, runValidators: true });

module.exports = {
  create,
  findById,
  findBySlug,
  findByInviteCode,
  findByIdWithInviteCode,
  setInviteCode,
  search,
  update,
};