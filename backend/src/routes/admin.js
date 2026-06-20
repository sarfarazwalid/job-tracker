const express = require('express');
const {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  listApplications,
  getStats,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    List all users
 * @access  Admin
 */
router.get('/users', listUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Admin
 */
router.get('/users/:id', getUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (role, status)
 * @access  Admin
 */
router.put('/users/:id', updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate user
 * @access  Admin
 */
router.delete('/users/:id', deactivateUser);

/**
 * @route   GET /api/admin/applications
 * @desc    List all applications
 * @access  Admin
 */
router.get('/applications', listApplications);

/**
 * @route   GET /api/admin/stats
 * @desc    Dashboard statistics
 * @access  Admin
 */
router.get('/stats', getStats);

module.exports = router;