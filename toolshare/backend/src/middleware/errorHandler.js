'use strict';

/**
 * Global Express error handler.
 * Catches any error passed via next(err) and returns a consistent JSON shape.
 * Never exposes internal details or stack traces to the client.
 */
const errorHandler = (err, _req, res, _next) => {
  // Log full error for developers (in production, pipe to Sentry/Logtail)
  console.error('[ERROR]', err);

  // Prisma "record not found" error
  if (err.code === 'P2025') {
    return res.status(404).json({ error: true, message: 'Resource not found.', code: 'NOT_FOUND' });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ error: true, message: 'A record with that value already exists.', code: 'CONFLICT' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: true, message: 'Invalid or expired token.', code: 'UNAUTHORISED' });
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({ error: true, message: err.message, code: 'VALIDATION_ERROR', fields: err.fields });
  }

  // Default: 500 internal server error
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'An unexpected error occurred. Please try again.';

  return res.status(status).json({ error: true, message, code: err.code || 'INTERNAL_ERROR' });
};

/**
 * Helper — throw a structured HTTP error from route handlers.
 */
const createError = (status, message, code) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

module.exports = { errorHandler, createError };
