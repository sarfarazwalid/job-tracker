const OpenAI = require('openai');
const env = require('../config/env');
const logger = require('../utils/logger');

let openaiClient = null;

// ── Rate limiting (in-memory) ─────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 messages per minute per user

/**
 * Check if a user has exceeded the rate limit
 * @param {string} userId
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRecord = rateLimitMap.get(userId);

  if (!userRecord || now - userRecord.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(userId, { windowStart: now, count: 1 });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (userRecord.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - userRecord.windowStart);
    return { allowed: false, retryAfterMs };
  }

  userRecord.count += 1;
  return { allowed: true, retryAfterMs: 0 };
};

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// ── OpenAI client ─────────────────────────────────────────────────────

const getClient = () => {
  if (!openaiClient) {
    const config = {
      apiKey: env.OPENAI_API_KEY,
    };
    if (env.OPENROUTER_BASE_URL) {
      config.baseURL = env.OPENROUTER_BASE_URL;
    }
    openaiClient = new OpenAI(config);
  }
  return openaiClient;
};

// ── System prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Career Assistant, a friendly and knowledgeable AI helper built into JobTracker — an AI-powered job application tracker.

Your role is to help users with their job search and career development. You can assist with:

• Resume writing tips and improvements
• Job application strategy and best practices
• Interview preparation (common questions, STAR method, etc.)
• Career planning and skill development advice
• Salary negotiation tips
• Networking strategies
• Industry insights and trends
• Cover letter writing guidance
• LinkedIn profile optimization
• Job search techniques and platforms

Guidelines:
• Be conversational, supportive, and professional
• Give actionable, specific advice rather than generic platitudes
• Use bullet points and structured formatting when listing items
• Keep responses concise but thorough (aim for 2-4 paragraphs max unless asked for more)
• If you don't know something specific, acknowledge it honestly
• You can use markdown formatting: **bold**, *italic*, bullet lists, and code blocks
• Do NOT modify any applications, calculate match scores, or perform any database actions
• If asked about resume-job matching or scoring, direct them to the "AI Analyze" feature instead
• You are a conversational advisor, not a system that performs actions

Remember: You are a helpful career companion, always available to guide and support the user's job search journey.`;

// ── Input sanitization ────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONVERSATION_MESSAGES = 20; // Keep last 20 messages for context

/**
 * Sanitize user input
 * @param {string} message
 * @returns {string}
 */
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') return '';
  // Remove null bytes and control characters (except newlines and tabs)
  let cleaned = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  cleaned = cleaned.trim();
  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    cleaned = cleaned.substring(0, MAX_MESSAGE_LENGTH);
  }
  return cleaned;
};

/**
 * Sanitize conversation history
 * @param {Array} conversation
 * @returns {Array}
 */
const sanitizeConversation = (conversation) => {
  if (!Array.isArray(conversation)) return [];
  return conversation
    .filter((msg) => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-MAX_CONVERSATION_MESSAGES) // Keep last N messages
    .map((msg) => ({
      role: msg.role,
      content: sanitizeMessage(msg.content),
    }));
};

// ── Main chat function ────────────────────────────────────────────────

/**
 * Process a chat message and return AI response
 * @param {string} userId
 * @param {string} message
 * @param {Array} conversation - recent conversation history
 * @returns {{ response: string, timestamp: string }}
 */
const chat = async (userId, message, conversation = []) => {
  // Rate limit check
  const { allowed, retryAfterMs } = checkRateLimit(userId);
  if (!allowed) {
    const err = new Error(`Rate limit exceeded. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`);
    err.status = 429;
    err.retryAfterMs = retryAfterMs;
    throw err;
  }

  // Sanitize inputs
  const cleanMessage = sanitizeMessage(message);
  if (!cleanMessage) {
    const err = new Error('Message cannot be empty.');
    err.status = 400;
    throw err;
  }

  const cleanConversation = sanitizeConversation(conversation);

  // Build messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...cleanConversation,
    { role: 'user', content: cleanMessage },
  ];

  const client = getClient();
  const model = env.OPENAI_MODEL;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0].message.content;

    return {
      response: responseText,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error.status === 429) {
      logger.warn('OpenAI rate limit hit in chat, retrying in 3s...');
      await new Promise((r) => setTimeout(r, 3000));
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });
      const responseText = completion.choices[0].message.content;
      return {
        response: responseText,
        timestamp: new Date().toISOString(),
      };
    }
    throw error;
  }
};

module.exports = {
  chat,
  checkRateLimit,
  sanitizeMessage,
  sanitizeConversation,
};