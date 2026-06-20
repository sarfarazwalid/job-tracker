const mongoose = require('mongoose');
const { ALL_STATUS_VALUES, JOB_STATUSES } = require('../config/constants');
const { isValidTransition } = require('../utils/helpers');

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [255, 'Company name cannot exceed 255 characters'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [255, 'Job title cannot exceed 255 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ALL_STATUS_VALUES,
        message: '{VALUE} is not a valid status',
      },
      default: JOB_STATUSES.WISHLIST,
      required: true,
    },
    appliedDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    jobDescription: {
      type: String,
      default: '',
      maxlength: [10000, 'Job description cannot exceed 10000 characters'],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    salaryRange: {
      type: String,
      default: '',
      trim: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    // AI-generated fields
    aiFitScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiInsights: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound indexes matching the original Django backend
jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, appliedDate: -1 });
jobApplicationSchema.index({ userId: 1, createdAt: -1 });

// Unique constraint: one application per user per company+title
jobApplicationSchema.index(
  { userId: 1, companyName: 1, jobTitle: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }, // Case-insensitive
  }
);

// Text search index
jobApplicationSchema.index(
  { companyName: 'text', jobTitle: 'text', notes: 'text' }
);

// Validate status transitions on update
jobApplicationSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const currentStatus = update.$set?.status;

  if (currentStatus && this._currentStatus && currentStatus !== this._currentStatus) {
    if (!isValidTransition(this._currentStatus, currentStatus)) {
      return next(
        new Error(
          `Invalid transition from ${this._currentStatus} to ${currentStatus}`
        )
      );
    }
  }
  next();
});

// Virtual for application URL
jobApplicationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;