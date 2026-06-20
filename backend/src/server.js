const app = require('./app');
const { connectDB } = require('./config/db');
const { getRedisClient, waitForRedis } = require('./config/redis');
const { closeQueues, initQueues } = require('./jobs/queue');
const { startScheduler, stopScheduler } = require('./jobs/scheduler');
const logger = require('./utils/logger');
const env = require('./config/env');

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Redis connection (wait with timeout)
    const redis = getRedisClient();
    const redisReady = await waitForRedis(redis, 'main', 5000);
    if (redisReady) {
      logger.info('Redis connected and ready');
    } else {
      logger.warn('Redis not available - some features (caching, queues) may be limited');
    }

    // Initialize BullMQ queues (with its own Redis connection)
    await initQueues();

    // Start notification scheduler
    startScheduler();

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          stopScheduler();
        } catch (err) {
          logger.error(`Error stopping scheduler: ${err.message}`);
        }

        try {
          await closeQueues();
        } catch (err) {
          logger.error(`Error closing queues: ${err.message}`);
        }

        try {
          const { disconnectRedis } = require('./config/redis');
          await disconnectRedis();
        } catch (err) {
          logger.error(`Error disconnecting Redis: ${err.message}`);
        }

        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (err) {
          logger.error(`Error closing MongoDB: ${err.message}`);
        }

        process.exit(0);
      });

      // Force shutdown after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught Exception: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();