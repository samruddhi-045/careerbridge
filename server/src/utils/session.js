/**
 * A JWT stays valid until it expires -- there is no way to "delete" one that's
 * already out there. So to end existing sessions after a password reset, we
 * record WHEN the password changed and reject any token issued before that.
 *
 * Without this, resetting a password does nothing to an attacker who already
 * holds a refresh token: they keep renewing access for the full 7 days, which
 * is exactly the situation a password reset is supposed to end.
 */
const isTokenStale = (user, payload) => {
  if (!user.passwordChangedAt || !payload?.iat) return false;
  // iat is in seconds, passwordChangedAt is a Date
  return payload.iat * 1000 < user.passwordChangedAt.getTime();
};

module.exports = { isTokenStale };