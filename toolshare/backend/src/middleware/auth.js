'use strict';

const passport = require('passport');

/**
 * Require a valid JWT. Returns 401 if not authenticated.
 */
const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: true, message: 'Unauthorised.', code: 'UNAUTHORISED' });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Require a valid JWT and that the user's email is verified.
 */
const requireVerified = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!req.user.emailVerified) {
      return res.status(403).json({
        error: true,
        message: 'Please verify your email address before performing this action.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
    return next();
  });
};

module.exports = { requireAuth, requireVerified };
