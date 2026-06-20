const interviewService = require('../services/interviewService');

/**
 * GET /api/interviews - List interviews
 */
const listInterviews = async (req, res, next) => {
  try {
    const result = await interviewService.list(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interviews/upcoming - Get upcoming interviews
 */
const getUpcoming = async (req, res, next) => {
  try {
    const interviews = await interviewService.getUpcoming(req.user.id, parseInt(req.query.days, 10) || 30);
    res.json({ data: interviews });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interviews/:id - Get single interview
 */
const getInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.getById(req.user.id, req.params.id);
    res.json(interview);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interviews - Create interview
 */
const createInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.create(req.user.id, req.body);
    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/interviews/:id - Update interview
 */
const updateInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.update(req.user.id, req.params.id, req.body);
    res.json(interview);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/interviews/:id - Delete interview
 */
const deleteInterview = async (req, res, next) => {
  try {
    await interviewService.delete(req.user.id, req.params.id);
    res.json({ detail: 'Interview deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listInterviews,
  getUpcoming,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
};