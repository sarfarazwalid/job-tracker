/**
 * AI Prompt Templates for Job Application Tracker
 * Centralized prompt engineering for all AI features
 */

const RESUME_MATCH_PROMPT = `
You are an expert recruitment analyst. Analyze the following resume against the job description.

RESUME:
{resume}

JOB DESCRIPTION:
{jobDescription}

Provide a JSON response with:
{
  "matchScore": <0-100>,
  "matchingSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "recommendation": "<brief recommendation on how to improve application>",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...]
}

Be specific and actionable. Only respond with valid JSON.
`;

const RESUME_ANALYZE_PROMPT = `
You are an expert recruitment analyst. Analyze how well a candidate's resume matches a job description.

RESUME:
{resumeText}

JOB DESCRIPTION:
{jobDescription}

Provide a JSON response with the following fields ONLY:
{
  "matchScore": <number 0-100>,
  "matchingSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "summary": "<2-3 sentence explanation of the match result>"
}

Rules:
- matchScore must be an integer between 0 and 100
- matchingSkills must be a non-empty array of strings (skills found in the resume that match the job)
- missingSkills must be an array of strings (skills required by the job but missing from the resume)
- summary must be a concise, honest assessment

Only respond with valid JSON. No markdown, no extra text.
`;

const JOB_FIT_PROMPT = `
You are a career coach specializing in job fit analysis. Evaluate how well a candidate fits a specific job.

CANDIDATE PROFILE:
{profile}

JOB DETAILS:
{jobDetails}

Provide a JSON response with:
{
  "score": <0-100>,
  "breakdown": {
    "skillsMatch": <0-100>,
    "experienceMatch": <0-100>,
    "locationMatch": <0-100>,
    "cultureMatch": <0-100>
  },
  "insights": "<detailed insight on fit>",
  "suggestions": ["suggestion1", "suggestion2", ...]
}

Only respond with valid JSON.
`;

const COVER_LETTER_PROMPT = `
You are an expert cover letter writer. Generate a professional, tailored cover letter.

JOB DETAILS:
{jobDetails}

CANDIDATE PROFILE:
{profile}

ADDITIONAL CONTEXT:
{additionalContext}

Requirements:
- Professional and engaging tone
- Customized to the specific role and company
- Highlight relevant experience
- Keep it under 500 words
- Include a strong opening and closing

Return the cover letter as plain text (not JSON).
`;

const INTERVIEW_QUESTIONS_PROMPT = `
You are a senior hiring manager. Generate relevant interview questions and suggested answers.

JOB TITLE: {jobTitle}
COMPANY: {company}
ROLE LEVEL: {roleLevel}

Generate 10 interview questions across these categories:
- Technical/Skills-based (3 questions)
- Behavioral (3 questions)
- Cultural Fit (2 questions)
- Situational (2 questions)

For each question provide:
- The question
- A suggested answer
- Category tag

Provide a JSON response with:
{
  "questions": [
    {
      "question": "...",
      "suggestedAnswer": "...",
      "category": "technical|behavioral|cultural|situational"
    }
  ]
}

Only respond with valid JSON.
`;

const JOB_SUMMARY_PROMPT = `
You are a job market analyst. Analyze a job description and provide insights.

JOB DESCRIPTION:
{jobDescription}

CANDIDATE PROFILE:
{profile}

Provide a JSON response with:
{
  "summary": "<concise summary of the job (2-3 sentences)>",
  "keyRequirements": ["requirement1", "requirement2", ...],
  "skillGaps": ["gap1", "gap2", ...],
  "suggestedLearning": [
    {"skill": "...", "resource": "...", "priority": "high|medium|low"}
  ],
  "salaryInsight": "<brief estimate of salary range if inferable>",
  "companyInsight": "<brief company description>"
}

Only respond with valid JSON.
`;

const CAREER_INSIGHTS_PROMPT = `
You are a career strategist. Analyze a candidate's job application history and provide insights.

APPLICATION HISTORY:
{applications}

PROFILE:
{profile}

Provide a JSON response with:
{
  "applicationStats": {
    "total": <number>,
    "byStatus": { "Applied": 5, "Interview_Scheduled": 3, ... },
    "averageStatusProgress": <0-100>
  },
  "successRate": <0-100>,
  "industryInsights": [
    {"industry": "...", "applications": <number>, "recommendation": "..."}
  ],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "strengthAreas": ["area1", "area2", ...],
  "improvementAreas": ["area1", "area2", ...]
}

Only respond with valid JSON.
`;

module.exports = {
  RESUME_MATCH_PROMPT,
  RESUME_ANALYZE_PROMPT,
  JOB_FIT_PROMPT,
  COVER_LETTER_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT,
  JOB_SUMMARY_PROMPT,
  CAREER_INSIGHTS_PROMPT,
};