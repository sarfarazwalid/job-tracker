const Interview = require('../models/Interview');
const JobApplication = require('../models/JobApplication');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class InterviewService {
  /**
   * List interviews for a user with date range filtering
   */
  async list(userId, { cursor, limit: limitStr = '50', startDate, endDate } = {}) {
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 200);
    const filter = { userId };

    if (startDate || endDate) {
      filter.interviewDate = {};
      if (startDate) filter.interviewDate.$gte = new Date(startDate);
      if (endDate) filter.interviewDate.$lte = new Date(endDate);
    }

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const interviews = await Interview.find(filter)
      .sort({ interviewDate: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = interviews.length > limit;
    const data = hasMore ? interviews.slice(0, limit) : interviews;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;

    return { data, nextCursor, hasMore };
  }

  /**
   * Get a single interview
   */
  async getById(userId, interviewId) {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      const error = new Error('Interview not found.');
      error.statusCode = 404;
      throw error;
    }
    return interview;
  }

  /**
   * Create an interview and optionally create a notification reminder
   */
  async create(userId, data) {
    // Verify the application belongs to the user
    const application = await JobApplication.findOne({
      _id: data.applicationId,
      userId,
    });
    if (!application) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    const interview = await Interview.create({
      userId,
      applicationId: data.applicationId,
      companyName: data.companyName || application.companyName,
      jobTitle: data.jobTitle || application.jobTitle,
      interviewDate: new Date(data.interviewDate),
      interviewType: data.interviewType || 'video',
      duration: data.duration || 60,
      location: data.location || '',
      notes: data.notes || '',
      status: 'scheduled',
    });

    // Auto-create interview reminder notification
    try {
      await notificationService.createInterviewNotification(
        userId,
        interview.applicationId,
        interview.companyName,
        interview.jobTitle,
        interview.interviewDate,
        'scheduled'
      );
    } catch (err) {
      logger.warn(`Failed to create interview reminder notification: ${err.message}`);
    }

    logger.info(`Interview created: ${interview.companyName} - ${interview.jobTitle} on ${interview.interviewDate}`);

    return interview;
  }

  /**
   * Update an interview
   */
  async update(userId, interviewId, updateData) {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      const error = new Error('Interview not found.');
      error.statusCode = 404;
      throw error;
    }

    const allowedUpdates = ['interviewDate', 'interviewType', 'duration', 'location', 'notes', 'status'];
    const sanitized = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        sanitized[key] = key === 'interviewDate' ? new Date(updateData[key]) : updateData[key];
      }
    }

    const updated = await Interview.findByIdAndUpdate(
      interviewId,
      { $set: sanitized },
      { new: true, runValidators: true }
    );

    logger.info(`Interview updated: ${interview.companyName} - ${interview.jobTitle}`);

    return updated;
  }

  /**
   * Delete an interview
   */
  async delete(userId, interviewId) {
    const interview = await Interview.findOneAndDelete({ _id: interviewId, userId });
    if (!interview) {
      const error = new Error('Interview not found.');
      error.statusCode = 404;
      throw error;
    }
    return interview;
  }

  /**
   * Get upcoming interviews for a user
   */
  async getUpcoming(userId, days = 30) {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Interview.find({
      userId,
      interviewDate: { $gte: now, $lte: end },
      status: 'scheduled',
    })
      .sort({ interviewDate: 1 })
      .lean();
  }
}

module.exports = new InterviewService();