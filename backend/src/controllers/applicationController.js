const applicationService = require('../services/applicationService');

/**
 * GET /api/applications - List applications (cursor-based pagination)
 */
const listApplications = async (req, res, next) => {
  try {
    const result = await applicationService.list(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/applications - Create application
 */
const createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.create(req.user.id, req.body);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applications/:id - Get single application
 */
const getApplication = async (req, res, next) => {
  try {
    const application = await applicationService.getById(req.user.id, req.params.id);
    res.json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/applications/:id - Update application
 */
const updateApplication = async (req, res, next) => {
  try {
    const application = await applicationService.update(req.user.id, req.params.id, req.body);
    res.json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/applications/:id - Delete application
 */
const deleteApplication = async (req, res, next) => {
  try {
    await applicationService.delete(req.user.id, req.params.id);
    res.json({ detail: 'Application deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/applications/stats - Get application statistics
 */
const getStats = async (req, res, next) => {
  try {
    const result = await applicationService.getStats(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
};