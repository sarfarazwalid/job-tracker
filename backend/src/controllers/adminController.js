const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const AIResult = require('../models/AIResult');
const { parsePaginationParams, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/admin/users - List all users
 */
const listUsers = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePaginationParams(req.query, 20);
    const filter = {};
    if (cursor) filter._id = { $lt: cursor };

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const result = buildPaginationResponse(users, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:id - Get user details
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id - Update user (admin can change role, status)
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    logger.info(`Admin updated user: ${user.username}`);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id - Deactivate user
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    logger.info(`Admin deactivated user: ${user.username}`);
    res.json({ detail: 'User deactivated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/applications - List all applications
 */
const listApplications = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePaginationParams(req.query, 20);
    const filter = {};
    if (cursor) filter._id = { $lt: cursor };

    const applications = await JobApplication.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('userId', 'username email')
      .lean();

    const result = buildPaginationResponse(applications, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats - Dashboard statistics
 */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalApplications, totalAIResults] = await Promise.all([
      User.countDocuments(),
      JobApplication.countDocuments(),
      AIResult.countDocuments({ status: 'completed' }),
    ]);

    const applicationByStatus = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = {};
    applicationByStatus.forEach(({ _id, count }) => {
      byStatus[_id] = count;
    });

    res.json({
      totalUsers,
      totalApplications,
      totalAIResults,
      applicationByStatus: byStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  listApplications,
  getStats,
};