const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Generate an access token
 * @param {object} user - { id, role }
 * @returns {string}
 */
const generateAccessToken = (user) => {
  const payload = { id: user.id || user._id, role: user.role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate a refresh token
 * @param {object} user - { id, role }
 * @returns {string}
 */
const generateRefreshToken = (user) => {
  const payload = { id: user.id || user._id, role: user.role, type: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Generate both access and refresh tokens
 * @param {object} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Verify an access token
 * @param {string} token
 * @returns {object|null} decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {object|null} decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Blacklist a token in Redis (stores the JTI or token hash with TTL)
 * @param {string} token - token to blacklist
 * @param {number} ttlSeconds - TTL in seconds
 */
const blacklistToken = async (token, ttlSeconds) => {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_KEYS.TOKEN_BLACKLIST}${token}`;
    await redis.set(key, 'blacklisted', 'EX', ttlSeconds);
  } catch (error) {
    logger.error(`Failed to blacklist token: ${error.message}`);
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token
 * @returns {boolean}
 */
const isTokenBlacklisted = async (token) => {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_KEYS.TOKEN_BLACKLIST}${token}`;
    const result = await redis.get(key);
    return result === 'blacklisted';
  } catch (error) {
    logger.error(`Failed to check token blacklist: ${error.message}`);
    return false;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
};