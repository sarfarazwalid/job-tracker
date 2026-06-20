const express = require('express');
const { body } = require('express-validator');
const { register, login, refresh, logout, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (blacklist tokens)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', authenticate, updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
