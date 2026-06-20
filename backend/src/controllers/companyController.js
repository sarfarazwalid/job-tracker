const companyService = require('../services/companyService');

const listCompanies = async (req, res, next) => {
  try {
    const result = await companyService.list(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.create(req.user.id, req.body);
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await companyService.getById(req.user.id, req.params.id);
    res.json(company);
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await companyService.update(req.user.id, req.params.id, req.body);
    res.json(company);
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    await companyService.delete(req.user.id, req.params.id);
    res.json({ detail: 'Company deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCompanies,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
};