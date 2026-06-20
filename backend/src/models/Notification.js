const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['interview', 'application', 'follow_up', 'offer', 'deadline', 'ai_insight'];
const NOTIFICATION_PRIORITIES = ['high', 'medium', 'low'];
const RELATED_ENTITY_TYPES = ['application', 'interview', 'offer'];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      required: [true, 'Notification description is required'],
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: 'medium',
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      type: String,
      enum: RELATED_ENTITY_TYPES,
      default: null,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

Notification.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
Notification.NOTIFICATION_PRIORITIES = NOTIFICATION_PRIORITIES;
Notification.RELATED_ENTITY_TYPES = RELATED_ENTITY_TYPES;

module.exports = Notification;
