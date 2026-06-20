const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
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
    website: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    companySize: {
      type: String,
      trim: true,
      default: '',
    },
    headquarters: {
      type: String,
      trim: true,
      default: '',
    },
    recruiterName: {
      type: String,
      trim: true,
      default: '',
    },
    recruiterEmail: {
      type: String,
      trim: true,
      default: '',
    },
    linkedInUrl: {
      type: String,
      trim: true,
      default: '',
    },
    companyNotes: {
      type: String,
      default: '',
      maxlength: [5000, 'Company notes cannot exceed 5000 characters'],
    },
    interviewExperienceNotes: {
      type: String,
      default: '',
      maxlength: [5000, 'Interview experience notes cannot exceed 5000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for efficient queries
companySchema.index({ userId: 1, companyName: 1 });
companySchema.index({ userId: 1, createdAt: -1 });

// Virtual for company ID
companySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;