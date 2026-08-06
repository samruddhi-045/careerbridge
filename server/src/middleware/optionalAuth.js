const userRepo = require("../repositories/user.repository");
const { verifyAccessToken } = require("../utils/token");
const { isTokenStale } = require("../utils/session");

/**
 * Attaches req.user IF a valid token is present, and does nothing otherwise.
 *
 * This is what lets job search be genuinely public while still personalising
 * for signed-in candidates: a stranger gets results, a candidate gets the same
 * results with their saved jobs marked. `protect` can't do this -- it throws
 * on a missing token, which would put every job link behind a login wall.
 *
 * A malformed or expired token is treated as "not signed in" rather than an
 * error, because on a public page it isn't one.
 */
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await userRepo.findByIdForAuth(payload.sub);

    if (user && user.status === "active" && !isTokenStale(user, payload)) {
      req.user = user;
    }
  } catch {
    // ignore — the caller is simply treated as anonymous
  }

  next();
};

module.exports = optionalAuth;