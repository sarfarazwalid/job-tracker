const { VALID_TRANSITIONS, JOB_STATUSES } = require('../config/constants');

/**
 * Validate a status transition
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
const isValidTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
};

/**
 * Validate that all required fields are present
 * @param {object} data
 * @param {string[]} requiredFields
 * @returns {{ valid: boolean, missing: string[] }}
 */
const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter((field) => {
    const val = data[field];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });
  return { valid: missing.length === 0, missing };
};

/**
 * Parse cursor-based pagination params from query string
 * @param {object} query
 * @param {number} defaultLimit
 * @returns {{ cursor: string|null, limit: number }}
 */
const parsePaginationParams = (query, defaultLimit = 20) => {
  const cursor = query.cursor || null;
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { cursor, limit };
};

/**
 * Generate pagination response
 * @param {any[]} items - items including extra item for hasMore detection
 * @param {number} limit - requested limit
 * @returns {{ data: any[], nextCursor: string|null, hasMore: boolean }}
 */
const buildPaginationResponse = (items, limit) => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
  return { data, nextCursor, hasMore };
};

/**
 * Sanitize string for search (removes special regex characters)
 * @param {string} str
 * @returns {string}
 */
const sanitizeSearch = (str) => {
  if (!str) return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Calculate total pages for cursor-based pagination
 * @param {number} total
 * @param {number} limit
 * @returns {number}
 */
const calculateTotalPages = (total, limit) => Math.ceil(total / limit);

module.exports = {
  isValidTransition,
  validateRequiredFields,
  parsePaginationParams,
  buildPaginationResponse,
  sanitizeSearch,
  calculateTotalPages,
};