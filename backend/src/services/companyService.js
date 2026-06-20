const Company = require('../models/Company');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');
const { parsePaginationParams, buildPaginationResponse, sanitizeSearch } = require('../utils/helpers');

class CompanyService {
  async list(userId, query = {}) {
    const { cursor, limit } = parsePaginationParams(query, 20);
    const { search } = query;

    const filter = { userId };

    if (search) {
      const sanitized = sanitizeSearch(search);
      filter.companyName = { $regex: sanitized, $options: 'i' };
    }

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const cacheKey = `cache:companies:${userId}:${JSON.stringify({ cursor, limit, search })}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const result = buildPaginationResponse(companies, limit);
    await cacheService.set(cacheKey, result, 120);

    return result;
  }

  async create(userId, data) {
    const { companyName, website, industry, companySize, headquarters, recruiterName, recruiterEmail, linkedInUrl, companyNotes, interviewExperienceNotes } = data;

    const company = await Company.create({
      userId,
      companyName: companyName.trim(),
      website: website?.trim() || '',
      industry: industry?.trim() || '',
      companySize: companySize?.trim() || '',
      headquarters: headquarters?.trim() || '',
      recruiterName: recruiterName?.trim() || '',
      recruiterEmail: recruiterEmail?.trim() || '',
      linkedInUrl: linkedInUrl?.trim() || '',
      companyNotes: companyNotes?.trim() || '',
      interviewExperienceNotes: interviewExperienceNotes?.trim() || '',
    });

    await this._invalidateUserCache(userId);
    logger.info(`Company created: ${company.companyName} by user ${userId}`);

    return company;
  }

  async getById(userId, companyId) {
    const company = await Company.findOne({ _id: companyId, userId });
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }
    return company;
  }

  async update(userId, companyId, updateData) {
    const company = await Company.findOne({ _id: companyId, userId });
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await this._invalidateUserCache(userId);
    logger.info(`Company updated: ${updated.companyName} by user ${userId}`);

    return updated;
  }

  async delete(userId, companyId) {
    const company = await Company.findOneAndDelete({ _id: companyId, userId });
    if (!company) {
      const error = new Error('Company not found.');
      error.statusCode = 404;
      throw error;
    }

    await this._invalidateUserCache(userId);
    logger.info(`Company deleted: ${company.companyName} by user ${userId}`);

    return company;
  }

  async _invalidateUserCache(userId) {
    await cacheService.delPattern(`cache:companies:${userId}:*`);
  }
}

module.exports = new CompanyService();