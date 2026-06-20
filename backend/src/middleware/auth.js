const tokenService = require('../services/tokenService');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware - verifies JWT access token
 * Attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Access token is required.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ detail: 'Access token is required.' });
    }

    // Check if token is blacklisted
    const blacklisted = await tokenService.isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ detail: 'Token has been revoked.' });
    }

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ detail: 'Invalid or expired access token.' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ detail: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ detail: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({ detail: 'Authentication error.' });
  }
};

module.exports = { authenticate };