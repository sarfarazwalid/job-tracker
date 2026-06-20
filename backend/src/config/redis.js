const Redis = require('ioredis');
const logger = require('../utils/logger');
const env = require('./env');

let redisClient = null;
let redisSubscriber = null;

/**
 * Check if Redis is configured to be available.
 * Returns false if Redis host/port are not set or if explicitly disabled.
 */
const isRedisConfigured = () => {
  return !!(env.REDIS_HOST && env.REDIS_PORT);
};

const createRedisClient = (name = 'default') => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) {
        // Silently stop retrying after 10 attempts
        return null;
      }
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
  });

  client.on('connect', () => {
    logger.info(`Redis ${name}: connected`);
  });

  client.on('error', (err) => {
    // Suppress ECONNREFUSED spam - only log once, then silently retry
    if (err.code === 'ECONNREFUSED' && !client.__refusedLogged) {
      logger.warn(`Redis ${name}: connection refused at ${env.REDIS_HOST}:${env.REDIS_PORT} - running without Redis`);
      client.__refusedLogged = true;
    } else if (err.code !== 'ECONNREFUSED') {
      logger.error(`Redis ${name}: error - ${err.message}`);
    }
  });

  client.on('reconnecting', () => {
    // Suppress reconnecting messages for cleaner logs
  });

  client.on('ready', () => {
    logger.info(`Redis ${name}: ready`);
    client.__refusedLogged = false;
  });

  return client;
};

/**
 * Wait for a Redis client to become ready, with timeout.
 * Returns the client if ready, or null if connection fails.
 */
const waitForRedis = (client, name = 'default', timeoutMs = 5000) => {
  return new Promise((resolve) => {
    if (client.status === 'ready') {
      return resolve(client);
    }

    const timeout = setTimeout(() => {
      logger.warn(`Redis ${name}: connection timed out after ${timeoutMs}ms, proceeding without Redis`);
      resolve(null);
    }, timeoutMs);

    client.connect()
      .then(() => {
        clearTimeout(timeout);
        resolve(client);
      })
      .catch((err) => {
        logger.error(`Redis ${name}: failed to connect - ${err.message}`);
        clearTimeout(timeout);
        resolve(null);
      });
  });
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient('main');
  }
  return redisClient;
};

const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient('subscriber');
  }
  return redisSubscriber;
};

const disconnectRedis = async () => {
  const promises = [];
  if (redisClient) {
    promises.push(redisClient.quit().catch(() => {}));
    redisClient = null;
  }
  if (redisSubscriber) {
    promises.push(redisSubscriber.quit().catch(() => {}));
    redisSubscriber = null;
  }
  await Promise.all(promises);
  logger.info('Redis connections closed');
};

module.exports = {
  getRedisClient,
  getRedisSubscriber,
  disconnectRedis,
  createRedisClient,
  waitForRedis,
};
