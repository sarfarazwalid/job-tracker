const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: {
      type: [messageSchema],
      validate: {
        validator: (v) => v.length <= 100,
        message: 'Conversation cannot exceed 100 messages',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete conversations after 30 days
conversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Limit: max 50 conversations per user
conversationSchema.statics.MAX_CONVERSATIONS = 1000;

module.exports = mongoose.model('AIConversation', conversationSchema);