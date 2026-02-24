'use strict';

const { validationResult } = require('express-validator');

/**
 * Reads express-validator results and returns a 422 if any fail.
 * Place after your validation chain in each route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: true,
      message: 'Validation failed.',
      code: 'VALIDATION_ERROR',
      fields: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
};

module.exports = { validate };
