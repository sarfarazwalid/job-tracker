const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications - List notifications (supports type filtering)
 */
const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.list(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count - Get unread count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read - Mark as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/unread - Mark as unread
 */
const markAsUnread = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsUnread(req.user.id, req.params.id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all - Mark all as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.delete(req.user.id, req.params.id);
    res.json({ detail: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/read - Clear all read notifications
 */
const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.clearReadNotifications(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
};