const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Service for managing user notifications.
 * Supports typed notifications with priorities, filtering, and real-time generation.
 */
class NotificationService {
  /**
   * Create a notification
   */
  async create({
    userId,
    type,
    title,
    description,
    priority = 'medium',
    relatedEntityId = null,
    relatedEntityType = null,
    actionUrl = null,
    scheduledAt = null,
  }) {
    const notification = await Notification.create({
      userId,
      type,
      title,
      description,
      priority,
      relatedEntityId,
      relatedEntityType,
      actionUrl,
      scheduledAt,
    });
    return notification;
  }

  /**
   * List notifications for a user with cursor-based pagination and optional type filtering
   */
  async list(userId, { cursor, limit: limitStr = '20', unreadOnly = false, type } = {}) {
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 100);
    const filter = { userId };

    if (unreadOnly === 'true' || unreadOnly === true) {
      filter.read = false;
    }

    if (type && Notification.NOTIFICATION_TYPES.includes(type)) {
      filter.type = type;
    }

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;

    // Include unread count alongside the list for convenience
    const unreadCount = await this.getUnreadCount(userId);

    return { data, nextCursor, hasMore, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      const error = new Error('Notification not found.');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  /**
   * Mark a single notification as unread
   */
  async markAsUnread(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: false } },
      { new: true }
    );
    if (!notification) {
      const error = new Error('Notification not found.');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, read: false });
  }

  /**
   * Delete a notification
   */
  async delete(userId, notificationId) {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!notification) {
      const error = new Error('Notification not found.');
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  /**
   * Clear all read notifications for a user
   */
  async clearReadNotifications(userId) {
    const result = await Notification.deleteMany({ userId, read: true });
    return { deletedCount: result.deletedCount };
  }

  // ── Helper methods for creating typed notifications ──────────────

  /**
   * Interview notification (scheduled, rescheduled, canceled, upcoming)
   */
  async createInterviewNotification(userId, applicationId, companyName, jobTitle, interviewDate, subType = 'scheduled') {
    const dateStr = new Date(interviewDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const titles = {
      scheduled: `Interview Scheduled — ${companyName}`,
      rescheduled: `Interview Rescheduled — ${companyName}`,
      canceled: `Interview Canceled — ${companyName}`,
      tomorrow: `Interview Tomorrow — ${companyName}`,
      today: `Interview Today — ${companyName}`,
      in_one_hour: `Interview in 1 Hour — ${companyName}`,
    };

    const descriptions = {
      scheduled: `You have an interview for ${jobTitle} at ${companyName} on ${dateStr}. Prepare well!`,
      rescheduled: `Your interview for ${jobTitle} at ${companyName} has been rescheduled to ${dateStr}.`,
      canceled: `Your interview for ${jobTitle} at ${companyName} has been canceled.`,
      tomorrow: `Reminder: You have an interview for ${jobTitle} at ${companyName} tomorrow at ${dateStr}.`,
      today: `Reminder: You have an interview for ${jobTitle} at ${companyName} today at ${dateStr}.`,
      in_one_hour: `Your interview for ${jobTitle} at ${companyName} starts in 1 hour!`,
    };

    return this.create({
      userId,
      type: 'interview',
      title: titles[subType] || titles.scheduled,
      description: descriptions[subType] || descriptions.scheduled,
      priority: ['today', 'in_one_hour', 'canceled'].includes(subType) ? 'high' : 'medium',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/calendar',
    });
  }

  /**
   * Application status change notification
   */
  async createStatusChangeNotification(userId, applicationId, companyName, jobTitle, previousStatus, newStatus) {
    return this.create({
      userId,
      type: 'application',
      title: `Application Updated — ${companyName}`,
      description: `Your application for ${jobTitle} at ${companyName} has moved from "${previousStatus}" to "${newStatus}".`,
      priority: 'medium',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });
  }

  /**
   * Follow-up reminder notification
   */
  async createFollowUpReminder(userId, applicationId, companyName, jobTitle, daysSinceActivity) {
    return this.create({
      userId,
      type: 'follow_up',
      title: `Follow Up — ${companyName}`,
      description: `It's been ${daysSinceActivity} days since you applied to ${companyName} for ${jobTitle}. Consider following up!`,
      priority: 'medium',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });
  }

  /**
   * Offer notification (received or expiring soon)
   */
  async createOfferNotification(userId, applicationId, companyName, jobTitle, subType = 'received') {
    const titles = {
      received: `Offer Received — ${companyName}`,
      expiring_soon: `Offer Expiring Soon — ${companyName}`,
    };

    const descriptions = {
      received: `Congratulations! You received an offer from ${companyName} for ${jobTitle}. Review and respond promptly.`,
      expiring_soon: `Your offer from ${companyName} for ${jobTitle} is expiring soon. Take action before the deadline.`,
    };

    return this.create({
      userId,
      type: 'offer',
      title: titles[subType] || titles.received,
      description: descriptions[subType] || descriptions.received,
      priority: 'high',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });
  }

  /**
   * Deadline notification
   */
  async createDeadlineNotification(userId, applicationId, companyName, jobTitle, deadlineType, remainingTime) {
    return this.create({
      userId,
      type: 'deadline',
      title: `Deadline Approaching — ${companyName}`,
      description: `The ${deadlineType} for ${jobTitle} at ${companyName} is approaching. ${remainingTime} remaining.`,
      priority: 'medium',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });
  }

  /**
   * AI Insight notification (low priority, optional)
   */
  async createAIInsightNotification(userId, applicationId, companyName, jobTitle, insightMessage) {
    return this.create({
      userId,
      type: 'ai_insight',
      title: `AI Insight — ${companyName}`,
      description: insightMessage.includes(companyName) ? insightMessage : `${insightMessage} for ${jobTitle} at ${companyName}.`,
      priority: 'low',
      relatedEntityId: applicationId,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });
  }
}

module.exports = new NotificationService();