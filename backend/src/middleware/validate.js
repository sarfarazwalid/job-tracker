const { validationResult } = require('express-validator');

/**
 * Validation middleware - checks for validation errors
 * Used after express-validator chain
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      detail: 'Validation failed',
      errors: formatted,
    });
  }
  next();
};

module.exports = { validate };