const aiChatService = require('../services/aiChat.service');
const AIConversation = require('../models/AIConversation');
const logger = require('../utils/logger');

/**
 * POST /api/ai/chat
 * Process a chat message and return AI response
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversation } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ detail: 'Message is required.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ detail: 'Message must be 2000 characters or less.' });
    }

    const userId = req.user.id;

    try {
      const result = await aiChatService.chat(userId, message, conversation);

      // Store conversation asynchronously (don't block response)
      storeConversation(userId, message, result.response).catch((err) => {
        logger.error(`Failed to store conversation: ${err.message}`);
      });

      res.json(result);
    } catch (error) {
      if (error.status === 429) {
        return res.status(429).json({
          detail: error.message,
          retryAfterMs: error.retryAfterMs,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Store conversation in database (fire-and-forget)
 */
const storeConversation = async (userId, userMessage, assistantResponse) => {
  try {
    // Find existing conversation or create new one
    let conversation = await AIConversation.findOne({ userId }).sort({ createdAt: -1 });

    if (!conversation) {
      conversation = new AIConversation({ userId, messages: [] });
    }

    // Add messages
    conversation.messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse }
    );

    // Keep only last 100 messages
    if (conversation.messages.length > 100) {
      conversation.messages = conversation.messages.slice(-100);
    }

    await conversation.save();

    // Enforce max conversations per user
    const count = await AIConversation.countDocuments({ userId });
    if (count > AIConversation.MAX_CONVERSATIONS) {
      const oldest = await AIConversation.find({ userId })
        .sort({ createdAt: 1 })
        .limit(count - AIConversation.MAX_CONVERSATIONS);
      if (oldest.length > 0) {
        await AIConversation.deleteMany({
          _id: { $in: oldest.map((c) => c._id) },
        });
      }
    }
  } catch (error) {
    logger.error(`storeConversation error: ${error.message}`);
  }
};

/**
 * GET /api/ai/chat/history
 * Get recent chat conversations
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr, 10) || 5, 20);

    const conversations = await AIConversation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('messages createdAt')
      .lean();

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
};