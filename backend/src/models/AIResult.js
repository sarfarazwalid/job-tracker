const mongoose = require('mongoose');
const { QUEUE_NAMES } = require('../config/constants');

const aiResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      default: null,
    },
    feature: {
      type: String,
      enum: Object.values(QUEUE_NAMES),
      required: true,
      index: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
aiResultSchema.index({ userId: 1, feature: 1, status: 1 });
aiResultSchema.index({ userId: 1, applicationId: 1, feature: 1 });
aiResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // Auto-delete after 30 days

const AIResult = mongoose.model('AIResult', aiResultSchema);

module.exports = AIResult;