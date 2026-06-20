const JobApplication = require('../models/JobApplication');
const cacheService = require('./cacheService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { REDIS_KEYS, ALL_STATUS_VALUES } = require('../config/constants');
const { isValidTransition, parsePaginationParams, buildPaginationResponse, sanitizeSearch } = require('../utils/helpers');

/**
 * Service layer for Job Application business logic
 * Controllers delegate to this service for all data operations.
 */
class ApplicationService {
  /**
   * List applications with cursor-based pagination, filtering, and sorting
   */
  async list(userId, query = {}) {
    const { cursor, limit } = parsePaginationParams(query, 20);
    const { status, search, sort } = query;

    const filter = { userId };

    if (status && ALL_STATUS_VALUES.includes(status)) {
      filter.status = status;
    }

    if (search) {
      const sanitized = sanitizeSearch(search);
      filter.$or = [
        { companyName: { $regex: sanitized, $options: 'i' } },
        { jobTitle: { $regex: sanitized, $options: 'i' } },
        { notes: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const validSortFields = ['appliedDate', 'createdAt', 'updatedAt', 'status', 'companyName', 'jobTitle'];
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortDir = sort.startsWith('-') ? -1 : 1;
      if (validSortFields.includes(sortField)) {
        sortOption = { [sortField]: sortDir };
      }
    }

    const cacheKey = `${REDIS_KEYS.CACHE_USER_APPS}${userId}:${JSON.stringify({ cursor, limit, status, search, sort })}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const applications = await JobApplication.find(filter)
      .sort(sortOption)
      .limit(limit + 1)
      .lean();

    const result = buildPaginationResponse(applications, limit);
    await cacheService.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Create a new job application with duplicate detection
   */
  async create(userId, data) {
    const { companyName, jobTitle, status, appliedDate, notes, jobDescription, location, salaryRange, url } = data;

    // Duplicate check
    const existing = await JobApplication.findOne({
      userId,
      companyName: { $regex: `^${companyName}$`, $options: 'i' },
      jobTitle: { $regex: `^${jobTitle}$`, $options: 'i' },
    });

    if (existing) {
      const error = new Error('This job application already exists for your account.');
      error.statusCode = 409;
      throw error;
    }

    const application = await JobApplication.create({
      userId,
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      status: status || 'Wishlist',
      appliedDate: appliedDate || null,
      notes: notes || '',
      jobDescription: jobDescription || '',
      location: location || '',
      salaryRange: salaryRange || '',
      url: url || '',
    });

    await this._invalidateUserCache(userId);
    logger.info(`Application created: ${application.companyName} - ${application.jobTitle} by user ${userId}`);

    return application;
  }

  /**
   * Get a single application, scoped to user
   */
  async getById(userId, applicationId) {
    const application = await JobApplication.findOne({
      _id: applicationId,
      userId,
    });

    if (!application) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    return application;
  }

  /**
   * Update an application with status transition validation and duplicate detection
   */
  async update(userId, applicationId, updateData) {
    const current = await JobApplication.findOne({ _id: applicationId, userId });
    if (!current) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    // Allow free status transitions (kanban drag-and-drop, manual overrides)
    // Status validation is handled at the UI level

    if (
      (updateData.companyName && updateData.companyName !== current.companyName) ||
      (updateData.jobTitle && updateData.jobTitle !== current.jobTitle)
    ) {
      const newCompany = updateData.companyName || current.companyName;
      const newTitle = updateData.jobTitle || current.jobTitle;
      const existing = await JobApplication.findOne({
        userId,
        companyName: { $regex: `^${newCompany}$`, $options: 'i' },
        jobTitle: { $regex: `^${newTitle}$`, $options: 'i' },
        _id: { $ne: applicationId },
      });
      if (existing) {
        const error = new Error('This job application already exists for your account.');
        error.statusCode = 409;
        throw error;
      }
    }

    const previousStatus = current.status;
    const newStatus = updateData.status || previousStatus;

    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await this._invalidateUserCache(userId);
    logger.info(`Application updated: ${application.companyName} - ${application.jobTitle} by user ${userId}`);

    // Create notifications based on status changes
    if (newStatus !== previousStatus) {
      try {
        // General status change notification
        await notificationService.createStatusChangeNotification(
          userId,
          applicationId,
          application.companyName,
          application.jobTitle,
          previousStatus,
          newStatus
        );

        // High-priority offer notification
        if (newStatus === 'Offer_Received') {
          await notificationService.createOfferNotification(
            userId,
            applicationId,
            application.companyName,
            application.jobTitle,
            'received'
          );
        }
      } catch (err) {
        logger.warn(`Failed to create status change notification: ${err.message}`);
      }
    }

    return application;
  }

  /**
   * Delete an application
   */
  async delete(userId, applicationId) {
    const application = await JobApplication.findOneAndDelete({ _id: applicationId, userId });
    if (!application) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    await this._invalidateUserCache(userId);
    logger.info(`Application deleted: ${application.companyName} - ${application.jobTitle} by user ${userId}`);

    return application;
  }

  /**
   * Get application statistics by status
   */
  async getStats(userId) {
    const cacheKey = `${REDIS_KEYS.CACHE_USER_APPS}${userId}:stats`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await JobApplication.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = {};
    let total = 0;
    stats.forEach(({ _id, count }) => {
      byStatus[_id] = count;
      total += count;
    });

    const result = { total, byStatus };
    await cacheService.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Invalidate all cached queries for a user
   */
  async _invalidateUserCache(userId) {
    await cacheService.delPattern(`${REDIS_KEYS.CACHE_USER_APPS}${userId}:*`);
  }
}

module.exports = new ApplicationService();