const express = require('express');
const { body } = require('express-validator');
const {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
} = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ALL_STATUS_VALUES } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/applications
 * @desc    List applications with cursor pagination
 * @access  Private
 */
router.get('/', listApplications);

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics by status
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/applications/:id
 * @desc    Get single application
 * @access  Private
 */
router.get('/:id', getApplication);

/**
 * @route   POST /api/applications
 * @desc    Create a new application
 * @access  Private
 */
router.post(
  '/',
  [
    body('companyName')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ max: 255 })
      .withMessage('Company name is too long'),
    body('jobTitle')
      .trim()
      .notEmpty()
      .withMessage('Job title is required')
      .isLength({ max: 255 })
      .withMessage('Job title is too long'),
    body('status')
      .optional()
      .isIn(ALL_STATUS_VALUES)
      .withMessage('Invalid status'),
    body('appliedDate')
      .optional()
      .isISO8601()
      .withMessage('Applied date must be a valid date'),
    body('notes')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('Notes cannot exceed 5000 characters'),
  ],
  validate,
  createApplication
);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update an application
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Company name is invalid'),
    body('jobTitle')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Job title is invalid'),
    body('status')
      .optional()
      .isIn(ALL_STATUS_VALUES)
      .withMessage('Invalid status'),
    body('appliedDate')
      .optional()
      .isISO8601()
      .withMessage('Applied date must be a valid date'),
    body('notes')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('Notes cannot exceed 5000 characters'),
  ],
  validate,
  updateApplication
);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Delete an application
 * @access  Private
 */
router.delete('/:id', deleteApplication);

module.exports = router;