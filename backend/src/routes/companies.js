const express = require('express');
const { body } = require('express-validator');
const { listCompanies, createCompany, getCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { authenticate: protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const companyValidation = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 255 })
    .withMessage('Company name is too long'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('recruiterEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
];

router.get('/', protect, listCompanies);
router.post('/', protect, companyValidation, createCompany);
router.get('/:id', protect, getCompany);
router.put('/:id', protect, companyValidation, updateCompany);
router.delete('/:id', protect, deleteCompany);

module.exports = router;