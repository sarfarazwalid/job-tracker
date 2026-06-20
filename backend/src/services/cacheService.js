const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a cached value by key
 * @param {string} key
 * @returns {any|null} parsed JSON or null if not found
 */
const get = async (key) => {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return null;
  }
};

/**
 * Set a value in cache
 * @param {string} key
 * @param {any} value - will be JSON stringified
 * @param {number} ttl - time to live in seconds
 */
const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
  }
};

/**
 * Delete a cached value
 * @param {string} key
 */
const del = async (key) => {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    logger.error(`Cache delete error: ${error.message}`);
  }
};

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Redis glob pattern (e.g., "cache:applications:*")
 */
const delPattern = async (pattern) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Cache: deleted ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error(`Cache delete pattern error: ${error.message}`);
  }
};

/**
 * Check if a key exists in cache
 * @param {string} key
 * @returns {boolean}
 */
const exists = async (key) => {
  try {
    const redis = getRedisClient();
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Cache exists error: ${error.message}`);
    return false;
  }
};

/**
 * Cache-aside pattern: get or compute and set
 * @param {string} key
 * @param {Function} computeFn - async function to compute value if not cached
 * @param {number} ttl
 * @returns {any}
 */
const getOrSet = async (key, computeFn, ttl = DEFAULT_TTL) => {
  const cached = await get(key);
  if (cached !== null) return cached;

  const value = await computeFn();
  await set(key, value, ttl);
  return value;
};

module.exports = {
  get,
  set,
  del,
  delPattern,
  exists,
  getOrSet,
};