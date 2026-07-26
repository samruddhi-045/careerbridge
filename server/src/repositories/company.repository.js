const Company = require("../models/Company");

const create = (data) => Company.create(data);

const findById = (id) => Company.findById(id);

const findBySlug = (slug) => Company.findOne({ slug });

// simple name search for the "join an existing company" flow, newest first
const search = (q) =>
  Company.find({ name: { $regex: q, $options: "i" } })
    .select("name slug industry location size logoUrl")
    .sort({ createdAt: -1 })
    .limit(10);

const update = (id, data) => Company.findByIdAndUpdate(id, data, { new: true, runValidators: true });

module.exports = { create, findById, findBySlug, search, update };
