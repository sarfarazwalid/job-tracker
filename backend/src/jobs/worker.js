const { Worker } = require('bullmq');
const { createRedisClient } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');
const aiService = require('../services/aiService');
const AIResult = require('../models/AIResult');
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const logger = require('../utils/logger');

const connection = createRedisClient('worker');

/**
 * Process Resume Match jobs
 */
const processResumeMatch = async (job) => {
  const { userId, resume, jobDescription, resultId } = job.data;
  logger.info(`Processing resume-match job ${job.id} for user ${userId}`);

  try {
    const output = await aiService.analyzeResumeMatch(resume, jobDescription);

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

/**
 * Process Job Fit jobs
 */
const processJobFit = async (job) => {
  const { userId, profile, jobDetails, applicationId, resultId } = job.data;
  logger.info(`Processing job-fit job ${job.id} for user ${userId}`);

  try {
    const output = await aiService.analyzeJobFit(profile, jobDetails);

    if (applicationId && output && output.score) {
      await JobApplication.findByIdAndUpdate(applicationId, {
        aiFitScore: output.score,
        aiInsights: output.insights || '',
      });
    }

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

/**
 * Process Cover Letter jobs
 */
const processCoverLetter = async (job) => {
  const { userId, jobDetails, profile, additionalContext, resultId } = job.data;
  logger.info(`Processing cover-letter job ${job.id} for user ${userId}`);

  try {
    const output = await aiService.generateCoverLetter(jobDetails, profile, additionalContext);

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

/**
 * Process Interview Questions jobs
 */
const processInterviewQuestions = async (job) => {
  const { jobTitle, company, roleLevel, resultId } = job.data;
  logger.info(`Processing interview-questions job ${job.id}`);

  try {
    const output = await aiService.generateInterviewQuestions(jobTitle, company, roleLevel);

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

/**
 * Process Job Summary jobs
 */
const processJobSummary = async (job) => {
  const { userId, jobDescription, profile, resultId } = job.data;
  logger.info(`Processing job-summary job ${job.id} for user ${userId}`);

  try {
    const output = await aiService.analyzeJobSummary(jobDescription, profile);

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

/**
 * Process Career Insights jobs
 */
const processCareerInsights = async (job) => {
  const { userId, applications, profile, resultId } = job.data;
  logger.info(`Processing career-insights job ${job.id} for user ${userId}`);

  try {
    const output = await aiService.generateCareerInsights(applications, profile);

    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        output,
        status: 'completed',
      });
    }

    return output;
  } catch (error) {
    if (resultId) {
      await AIResult.findByIdAndUpdate(resultId, {
        status: 'failed',
        error: error.message,
      });
    }
    throw error;
  }
};

// Create workers for each queue
const workers = [
  new Worker(QUEUE_NAMES.RESUME_MATCH, processResumeMatch, { connection, concurrency: 2 }),
  new Worker(QUEUE_NAMES.JOB_FIT, processJobFit, { connection, concurrency: 2 }),
  new Worker(QUEUE_NAMES.COVER_LETTER, processCoverLetter, { connection, concurrency: 2 }),
  new Worker(QUEUE_NAMES.INTERVIEW_QUESTIONS, processInterviewQuestions, { connection, concurrency: 2 }),
  new Worker(QUEUE_NAMES.JOB_SUMMARY, processJobSummary, { connection, concurrency: 2 }),
  new Worker(QUEUE_NAMES.CAREER_INSIGHTS, processCareerInsights, { connection, concurrency: 1 }),
];

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} in ${job.queueName} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} in ${job.queueName} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });
});

logger.info('All BullMQ workers started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers...');
  const promises = workers.map((w) => w.close());
  await Promise.all(promises);
  await connection.quit();
  process.exit(0);
});