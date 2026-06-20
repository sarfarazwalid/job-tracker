const { ROLES } = require('../config/constants');

/**
 * Role-based authorization middleware
 * Must be used after authenticate middleware
 * @param  {...string} allowedRoles - allowed roles (e.g., 'admin', 'user')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        detail: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

/**
 * Pre-built role middleware instances
 */
const requireAdmin = authorize(ROLES.ADMIN);
const requireUser = authorize(ROLES.USER, ROLES.ADMIN);

module.exports = { authorize, requireAdmin, requireUser };