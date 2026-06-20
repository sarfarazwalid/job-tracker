const User = require('../models/User');
const tokenService = require('./tokenService');
const logger = require('../utils/logger');

/**
 * Service layer for Authentication business logic
 * Controllers delegate to this service for all auth operations.
 */
class AuthService {
  /**
   * Register a new user
   */
  async register({ username, email, password }) {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      const error = new Error(
        existingUser.email === email
          ? 'An account with this email already exists.'
          : 'An account with this username already exists.'
      );
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({ username, email, password });
    const tokens = tokenService.generateTokens(user);

    logger.info(`New user registered: ${user.username}`);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Authenticate a user by username/email and password
   */
  async login({ username, password }) {
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select('+password');

    if (!user) {
      const error = new Error('Invalid username or password.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account has been deactivated.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid username or password.');
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = tokenService.generateTokens(user);

    logger.info(`User logged in: ${user.username}`);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Refresh tokens - validates, rotates, and returns new token pair
   */
  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 400;
      throw error;
    }

    const blacklisted = await tokenService.isTokenBlacklisted(refreshToken);
    if (blacklisted) {
      const error = new Error('Refresh token has been revoked.');
      error.statusCode = 401;
      throw error;
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      const error = new Error('User not found or deactivated.');
      error.statusCode = 401;
      throw error;
    }

    // Blacklist old refresh token (token rotation)
    await this._blacklistJwt(refreshToken);

    const tokens = tokenService.generateTokens(user);
    return tokens;
  }

  /**
   * Logout - blacklist both access and refresh tokens
   */
  async logout(accessToken, refreshToken, user) {
    if (refreshToken) {
      await this._blacklistJwt(refreshToken);
    }

    if (accessToken) {
      await this._blacklistJwt(accessToken);
    }

    logger.info(`User logged out: ${user.username}`);
  }

  /**
   * Get user profile
   */
  getProfile(user) {
    return { user: user.toJSON() };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { profile } = updateData;

    if (!profile) {
      const error = new Error('Profile data is required.');
      error.statusCode = 400;
      throw error;
    }

    // Only allow updating specific profile fields
    const allowedFields = ['firstName', 'lastName', 'resumeText', 'skills', 'experience', 'education', 'location', 'linkedIn'];
    const sanitizedProfile = {};
    for (const key of allowedFields) {
      if (profile[key] !== undefined) {
        sanitizedProfile[key] = profile[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profile: sanitizedProfile } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Profile updated for user: ${user.username}`);
    return { user: user.toJSON() };
  }

  /**
   * Change user password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Current password is incorrect.');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 8) {
      const error = new Error('Password must be at least 8 characters.');
      error.statusCode = 400;
      throw error;
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.username}`);
    return { detail: 'Password changed successfully.' };
  }

  /**
   * Blacklist a JWT token for the remainder of its TTL
   */
  async _blacklistJwt(token) {
    try {
      const { decode } = require('jsonwebtoken');
      const decodedToken = decode(token);
      if (decodedToken && decodedToken.exp) {
        const ttlSeconds = decodedToken.exp - Math.floor(Date.now() / 1000);
        if (ttlSeconds > 0) {
          await tokenService.blacklistToken(token, ttlSeconds);
        }
      }
    } catch {
      // Token may already be invalid, that's ok
    }
  }
}

module.exports = new AuthService();