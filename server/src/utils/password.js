const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

// fake hash used when email doesn't exist, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync("timing_attack_placeholder", SALT_ROUNDS);

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash || DUMMY_HASH);

module.exports = { hashPassword, verifyPassword };