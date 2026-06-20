const express = require('express');
const { body } = require('express-validator');
const {
  listInterviews,
  getUpcoming,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
} = require('../controllers/interviewController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', listInterviews);
router.get('/upcoming', getUpcoming);

router.post(
  '/',
  [
    body('applicationId').notEmpty().withMessage('Application ID is required'),
    body('interviewDate').isISO8601().withMessage('Valid interview date is required'),
    body('interviewType')
      .optional()
      .isIn(['phone', 'video', 'onsite', 'technical', 'behavioral', 'final', 'other'])
      .withMessage('Invalid interview type'),
  ],
  validate,
  createInterview
);

router.get('/:id', getInterview);

router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);

module.exports = router;