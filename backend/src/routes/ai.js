const express = require('express');
const { body } = require('express-validator');
const {
  resumeMatch,
  jobFit,
  coverLetter,
  interviewQuestions,
  jobSummary,
  careerInsights,
  analyzeResume,
  getAIHistory,
} = require('../controllers/aiController');
const { sendMessage, getChatHistory } = require('../controllers/aiChat.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/resume-match
 * @desc    Analyze resume against job description
 * @access  Private
 */
router.post(
  '/resume-match',
  [
    body('resume').trim().notEmpty().withMessage('Resume text is required'),
    body('jobDescription').trim().notEmpty().withMessage('Job description is required'),
  ],
  validate,
  resumeMatch
);

/**
 * @route   POST /api/ai/job-fit
 * @desc    Score job fit
 * @access  Private
 */
router.post(
  '/job-fit',
  [
    body('jobDetails').trim().notEmpty().withMessage('Job details are required'),
  ],
  validate,
  jobFit
);

/**
 * @route   POST /api/ai/cover-letter
 * @desc    Generate cover letter
 * @access  Private
 */
router.post(
  '/cover-letter',
  [
    body('jobDetails').trim().notEmpty().withMessage('Job details are required'),
  ],
  validate,
  coverLetter
);

/**
 * @route   POST /api/ai/interview-questions
 * @desc    Generate interview questions
 * @access  Private
 */
router.post(
  '/interview-questions',
  [
    body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
  ],
  validate,
  interviewQuestions
);

/**
 * @route   POST /api/ai/job-summary
 * @desc    Job summary + skill gap analysis
 * @access  Private
 */
router.post(
  '/job-summary',
  [
    body('jobDescription').trim().notEmpty().withMessage('Job description is required'),
  ],
  validate,
  jobSummary
);

/**
 * @route   GET /api/ai/career-insights
 * @desc    Career insights dashboard
 * @access  Private
 */
router.get('/career-insights', careerInsights);

/**
 * @route   GET /api/ai/history
 * @desc    Get AI result history
 * @access  Private
 */
router.get('/history', getAIHistory);

/**
 * @route   POST /api/ai/analyze-resume
 * @desc    Analyze resume against job description (AI Analyze page)
 * @access  Private
 */
router.post(
  '/analyze-resume',
  [
    body('resumeText').trim().notEmpty().withMessage('Resume text is required'),
    body('jobDescription').trim().notEmpty().withMessage('Job description is required'),
  ],
  validate,
  analyzeResume
);

/**
 * @route   POST /api/ai/chat
 * @desc    Send a chat message to Career Assistant
 * @access  Private
 */
router.post(
  '/chat',
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validate,
  sendMessage
);

/**
 * @route   GET /api/ai/chat/history
 * @desc    Get recent chat conversations
 * @access  Private
 */
router.get('/chat/history', getChatHistory);

module.exports = router;
