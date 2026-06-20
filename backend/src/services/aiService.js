const OpenAI = require('openai');
const env = require('../config/env');
const logger = require('../utils/logger');
const {
  RESUME_MATCH_PROMPT,
  RESUME_ANALYZE_PROMPT,
  JOB_FIT_PROMPT,
  COVER_LETTER_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT,
  JOB_SUMMARY_PROMPT,
  CAREER_INSIGHTS_PROMPT,
} = require('../utils/prompts');

let openaiClient = null;

/**
 * Get or create the OpenAI client
 * @returns {OpenAI}
 */
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

/**
 * Call OpenAI with a prompt, handle retries and rate limits
 * @param {string} prompt - full prompt text
 * @param {object} options - { temperature, maxTokens, responseFormat }
 * @returns {string} response text
 */
const callOpenAI = async (prompt, options = {}) => {
  const { temperature = 0.7, maxTokens = 2000, responseFormat = null } = options;
  const client = getClient();
  const model = env.OPENAI_MODEL;

  const params = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat === 'json') {
    params.response_format = { type: 'json_object' };
  }

  try {
    const completion = await client.chat.completions.create(params);
    return completion.choices[0].message.content;
  } catch (error) {
    if (error.status === 429) {
      // Rate limit - wait and retry once
      logger.warn('OpenAI rate limit hit, retrying in 5s...');
      await new Promise((r) => setTimeout(r, 5000));
      const completion = await client.chat.completions.create(params);
      return completion.choices[0].message.content;
    }
    throw error;
  }
};

/**
 * Parse JSON response from AI, with error handling
 * @param {string} text
 * @returns {object|null}
 */
const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through
      }
    }
    logger.error('Failed to parse AI JSON response');
    return null;
  }
};

// ── Feature-specific methods ──────────────────────────────────────────

/**
 * 1. Resume Match Analyzer
 */
const analyzeResumeMatch = async (resume, jobDescription) => {
  const prompt = RESUME_MATCH_PROMPT
    .replace('{resume}', resume)
    .replace('{jobDescription}', jobDescription);

  const response = await callOpenAI(prompt, { responseFormat: 'json' });
  return parseJSON(response);
};

/**
 * 2. Job Fit Scoring
 */
const analyzeJobFit = async (profile, jobDetails) => {
  const prompt = JOB_FIT_PROMPT
    .replace('{profile}', profile)
    .replace('{jobDetails}', jobDetails);

  const response = await callOpenAI(prompt, { responseFormat: 'json' });
  return parseJSON(response);
};

/**
 * 3. Cover Letter Generator
 */
const generateCoverLetter = async (jobDetails, profile, additionalContext = 'None') => {
  const prompt = COVER_LETTER_PROMPT
    .replace('{jobDetails}', jobDetails)
    .replace('{profile}', profile)
    .replace('{additionalContext}', additionalContext);

  const response = await callOpenAI(prompt, { temperature: 0.8, maxTokens: 1500 });
  return { coverLetter: response, wordCount: response.split(/\s+/).length };
};

/**
 * 4. Interview Question Generator
 */
const generateInterviewQuestions = async (jobTitle, company, roleLevel = 'Mid-level') => {
  const prompt = INTERVIEW_QUESTIONS_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{company}', company)
    .replace('{roleLevel}', roleLevel);

  const response = await callOpenAI(prompt, { responseFormat: 'json', maxTokens: 3000 });
  return parseJSON(response);
};

/**
 * 5. Job Summary + Skill Gap
 */
const analyzeJobSummary = async (jobDescription, profile = 'No profile provided') => {
  const prompt = JOB_SUMMARY_PROMPT
    .replace('{jobDescription}', jobDescription)
    .replace('{profile}', profile);

  const response = await callOpenAI(prompt, { responseFormat: 'json' });
  return parseJSON(response);
};

/**
 * 6. Career Insights Dashboard
 */
const generateCareerInsights = async (applications, profile = 'No profile provided') => {
  const prompt = CAREER_INSIGHTS_PROMPT
    .replace('{applications}', JSON.stringify(applications, null, 2))
    .replace('{profile}', profile);

  const response = await callOpenAI(prompt, { responseFormat: 'json', maxTokens: 3000 });
  return parseJSON(response);
};

/**
 * 7. Resume-Job Match Analyzer (dedicated for AI Analyze page)
 */
const analyzeResumeJobMatch = async (resumeText, jobDescription) => {
  const prompt = RESUME_ANALYZE_PROMPT
    .replace('{resumeText}', resumeText)
    .replace('{jobDescription}', jobDescription);

  const response = await callOpenAI(prompt, { responseFormat: 'json', temperature: 0.3, maxTokens: 1500 });
  const parsed = parseJSON(response);

  if (!parsed || typeof parsed.matchScore !== 'number' || !Array.isArray(parsed.matchingSkills)) {
    logger.error('AI returned invalid resume analysis JSON', parsed);
    return {
      matchScore: 0,
      matchingSkills: [],
      missingSkills: [],
      summary: 'Unable to analyze resume match. Please try again.',
    };
  }

  return {
    matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore))),
    matchingSkills: parsed.matchingSkills || [],
    missingSkills: parsed.missingSkills || [],
    summary: parsed.summary || 'Analysis completed.',
  };
};

module.exports = {
  analyzeResumeMatch,
  analyzeResumeJobMatch,
  analyzeJobFit,
  generateCoverLetter,
  generateInterviewQuestions,
  analyzeJobSummary,
  generateCareerInsights,
};
