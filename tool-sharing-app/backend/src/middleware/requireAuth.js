/**
 * requireAuth — route middleware
 *
 * Attach this to any route that needs a logged-in user.
 * Returns 401 JSON if the request has no valid session.
 */
module.exports = function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to do that.' });
};
