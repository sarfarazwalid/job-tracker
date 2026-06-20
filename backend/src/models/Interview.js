const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
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
      required: [true, 'Application ID is required'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    interviewDate: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    interviewType: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'behavioral', 'final', 'other'],
      default: 'video',
    },
    duration: {
      type: Number, // minutes
      default: 60,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    meetingUrl: {
      type: String,
      trim: true,
      default: '',
    },
    meetingAddress: {
      type: String,
      trim: true,
      default: '',
    },
    topicsToReview: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    questionsToAsk: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ userId: 1, interviewDate: 1 });
interviewSchema.index({ userId: 1, status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;