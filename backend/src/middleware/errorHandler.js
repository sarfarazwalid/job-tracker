const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      detail: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      detail: `A record with that ${field} already exists.`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      detail: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ detail: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ detail: 'Token has expired.' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error.'
      : err.message;

  return res.status(statusCode).json({ detail: message });
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  return res.status(404).json({ detail: `Not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };