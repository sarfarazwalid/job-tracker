const express = require('express');
const {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);
router.delete('/read', clearReadNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;