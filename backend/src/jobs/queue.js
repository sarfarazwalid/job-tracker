const { Queue } = require('bullmq');
const { createRedisClient, waitForRedis } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');
const logger = require('../utils/logger');

// Lazily-initialized Redis connection for BullMQ
let connection = null;
let queues = {};
let queuesReady = false;
let queueInitialized = false;
let queueInitDone = false;

/**
 * Initialize BullMQ queues after Redis becomes available.
 * This is called once from server.js after the main Redis connection is confirmed.
 */
const initQueues = async () => {
  if (queueInitDone) return;
  queueInitDone = true;

  try {
    connection = createRedisClient('bullmq');
    const redisReady = await waitForRedis(connection, 'bullmq', 5000);
    if (!redisReady) {
      logger.warn('BullMQ: Redis not available - queues are disabled');
      queueInitialized = false;
      return;
    }

    queues = {
      [QUEUE_NAMES.RESUME_MATCH]: new Queue(QUEUE_NAMES.RESUME_MATCH, { connection }),
      [QUEUE_NAMES.JOB_FIT]: new Queue(QUEUE_NAMES.JOB_FIT, { connection }),
      [QUEUE_NAMES.COVER_LETTER]: new Queue(QUEUE_NAMES.COVER_LETTER, { connection }),
      [QUEUE_NAMES.INTERVIEW_QUESTIONS]: new Queue(QUEUE_NAMES.INTERVIEW_QUESTIONS, { connection }),
      [QUEUE_NAMES.JOB_SUMMARY]: new Queue(QUEUE_NAMES.JOB_SUMMARY, { connection }),
      [QUEUE_NAMES.CAREER_INSIGHTS]: new Queue(QUEUE_NAMES.CAREER_INSIGHTS, { connection }),
    };

    connection.on('ready', () => {
      queuesReady = true;
      logger.info('BullMQ Redis connection ready');
    });

    connection.on('error', () => {
      queuesReady = false;
    });

    queuesReady = true;
    queueInitialized = true;
    logger.info('BullMQ queues initialized');
  } catch (err) {
    logger.warn(`BullMQ: Failed to initialize queues - ${err.message}. Running without queues.`);
    queueInitialized = false;
  }
};

/**
 * Add a job to a queue
 * @param {string} queueName
 * @param {object} data - job data
 * @param {object} opts - BullMQ job options
 */
const addJob = async (queueName, data, opts = {}) => {
  if (!queueInitialized || !queuesReady) {
    logger.warn(`BullMQ not ready, queueing is unavailable. Job "${queueName}" not added.`);
    return null;
  }

  const queue = queues[queueName];
  if (!queue) {
    logger.error(`Queue "${queueName}" not found`);
    return null;
  }

  const job = await queue.add(queueName, data, {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    ...opts,
  });

  logger.info(`Job added to ${queueName}: ${job.id}`);
  return job;
};

/**
 * Close all queues
 */
const closeQueues = async () => {
  const promises = Object.values(queues).map((q) => q.close().catch(() => {}));
  await Promise.all(promises);
  if (connection) {
    connection.quit().catch(() => {});
  }
  logger.info('All BullMQ queues closed');
};

module.exports = { queues, addJob, closeQueues, initQueues };
