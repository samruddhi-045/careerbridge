const crypto = require("crypto");

// generates a random token to email to the user, plus a sha256 hash of it to store in
// the DB — so a leaked/dumped database never reveals a usable token (same idea as passwords)
const createToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { createToken, hashToken };
