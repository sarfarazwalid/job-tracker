const AIResult = require('../models/AIResult');
const JobApplication = require('../models/JobApplication');
const aiService = require('../services/aiService');
const { QUEUE_NAMES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/ai/resume-match
 * Analyze resume against job description
 */
const resumeMatch = async (req, res, next) => {
  try {
    const { resume, jobDescription, applicationId } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ detail: 'Resume and job description are required.' });
    }

    // Save to AI results
    const result = await AIResult.create({
      userId: req.user.id,
      applicationId: applicationId || null,
      feature: QUEUE_NAMES.RESUME_MATCH,
      input: { resume: resume.substring(0, 500), jobDescription: jobDescription.substring(0, 500) },
      status: 'processing',
    });

    try {
      const output = await aiService.analyzeResumeMatch(resume, jobDescription);

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/job-fit
 * Score job fit
 */
const jobFit = async (req, res, next) => {
  try {
    const { profile, jobDetails, applicationId } = req.body;

    if (!jobDetails) {
      return res.status(400).json({ detail: 'Job details are required.' });
    }

    const userProfile = profile || formatUserProfile(req.user);

    const result = await AIResult.create({
      userId: req.user.id,
      applicationId: applicationId || null,
      feature: QUEUE_NAMES.JOB_FIT,
      input: { jobDetails: jobDetails.substring(0, 500) },
      status: 'processing',
    });

    try {
      const output = await aiService.analyzeJobFit(userProfile, jobDetails);

      result.output = output;
      result.status = 'completed';
      await result.save();

      // Update application AI fit score if applicationId provided
      if (applicationId && output && output.score) {
        await JobApplication.findByIdAndUpdate(applicationId, {
          aiFitScore: output.score,
          aiInsights: output.insights || '',
        });
      }

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/cover-letter
 * Generate cover letter
 */
const coverLetter = async (req, res, next) => {
  try {
    const { jobDetails, profile, additionalContext, applicationId } = req.body;

    if (!jobDetails) {
      return res.status(400).json({ detail: 'Job details are required.' });
    }

    const userProfile = profile || formatUserProfile(req.user);

    const result = await AIResult.create({
      userId: req.user.id,
      applicationId: applicationId || null,
      feature: QUEUE_NAMES.COVER_LETTER,
      input: { jobDetails: jobDetails.substring(0, 500) },
      status: 'processing',
    });

    try {
      const output = await aiService.generateCoverLetter(
        jobDetails,
        userProfile,
        additionalContext
      );

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/interview-questions
 * Generate interview questions
 */
const interviewQuestions = async (req, res, next) => {
  try {
    const { jobTitle, company, roleLevel, applicationId } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ detail: 'Job title and company are required.' });
    }

    const result = await AIResult.create({
      userId: req.user.id,
      applicationId: applicationId || null,
      feature: QUEUE_NAMES.INTERVIEW_QUESTIONS,
      input: { jobTitle, company, roleLevel },
      status: 'processing',
    });

    try {
      const output = await aiService.generateInterviewQuestions(
        jobTitle,
        company,
        roleLevel || 'Mid-level'
      );

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/job-summary
 * Job summary + skill gap analysis
 */
const jobSummary = async (req, res, next) => {
  try {
    const { jobDescription, applicationId } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ detail: 'Job description is required.' });
    }

    const profile = formatUserProfile(req.user);

    const result = await AIResult.create({
      userId: req.user.id,
      applicationId: applicationId || null,
      feature: QUEUE_NAMES.JOB_SUMMARY,
      input: { jobDescription: jobDescription.substring(0, 500) },
      status: 'processing',
    });

    try {
      const output = await aiService.analyzeJobSummary(jobDescription, profile);

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/career-insights
 * Career insights dashboard
 */
const careerInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all user applications
    const applications = await JobApplication.find({ userId })
      .sort({ createdAt: -1 })
      .select('companyName jobTitle status appliedDate location createdAt updatedAt')
      .lean();

    if (applications.length === 0) {
      return res.json({
        applicationStats: { total: 0, byStatus: {}, averageStatusProgress: 0 },
        successRate: 0,
        industryInsights: [],
        recommendations: ['Add some job applications to get career insights.'],
        strengthAreas: [],
        improvementAreas: [],
      });
    }

    const profile = formatUserProfile(req.user);

    const result = await AIResult.create({
      userId,
      feature: QUEUE_NAMES.CAREER_INSIGHTS,
      input: { applicationCount: applications.length },
      status: 'processing',
    });

    try {
      const output = await aiService.generateCareerInsights(applications, profile);

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/history
 * Get AI result history
 */
const getAIHistory = async (req, res, next) => {
  try {
    const { feature, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr, 10) || 20, 100);

    const filter = { userId: req.user.id, status: 'completed' };
    if (feature) filter.feature = feature;

    const results = await AIResult.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-input')
      .lean();

    res.json({ results });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/analyze-resume
 * Dedicated resume-job match analysis for the AI Analyze page
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ detail: 'Resume text is required.' });
    }
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ detail: 'Job description is required.' });
    }

    // Save to AI results
    const result = await AIResult.create({
      userId: req.user.id,
      feature: QUEUE_NAMES.RESUME_ANALYZE,
      input: {
        resumeLength: resumeText.length,
        jobDescriptionLength: jobDescription.length,
      },
      status: 'processing',
    });

    try {
      const output = await aiService.analyzeResumeJobMatch(resumeText, jobDescription);

      result.output = output;
      result.status = 'completed';
      await result.save();

      res.json({ id: result.id, ...output });
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await result.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: format user profile for AI prompts
 */
function formatUserProfile(user) {
  const p = user.profile || {};
  return [
    `Name: ${user.fullName || user.username}`,
    `Email: ${user.email}`,
    p.resumeText ? `Resume: ${p.resumeText}` : null,
    p.skills?.length ? `Skills: ${p.skills.join(', ')}` : null,
    p.experience ? `Experience: ${p.experience}` : null,
    p.education ? `Education: ${p.education}` : null,
    p.location ? `Location: ${p.location}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  resumeMatch,
  jobFit,
  coverLetter,
  interviewQuestions,
  jobSummary,
  careerInsights,
  analyzeResume,
  getAIHistory,
};
