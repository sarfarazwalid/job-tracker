const authService = require('../services/authService');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refresh);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }

    await authService.logout(accessToken, req.body.refresh, req.user);
    res.json({ detail: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json(authService.getProfile(req.user));
};

/**
 * PUT /api/auth/me - Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password - Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, updateProfile, changePassword };
