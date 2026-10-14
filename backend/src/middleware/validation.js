const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages[0],
      errors: errors.array(),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const createInterviewValidation = [
  body('jobTitle')
    .custom((val, { req }) => {
      const title = val || req.body.role || req.body.targetRole;
      if (!title || !String(title).trim()) {
        throw new Error('Job title or target role is required');
      }
      req.body.jobTitle = String(title).trim();
      return true;
    }),
  body('jobDescription')
    .optional()
    .custom((val, { req }) => {
      let jd = val || req.body.description || '';
      if (!jd || String(jd).trim().length < 20) {
        const title = req.body.jobTitle || 'Software Engineer';
        req.body.jobDescription = `Professional technical and behavioral interview assessment for ${title}. Rigorously evaluating problem-solving, architectural design, coding efficiency, and STAR methodology leadership competencies.`;
      }
      return true;
    }),
  body('experienceLevel')
    .optional(),
  body('numberOfQuestions')
    .optional(),
  body('questionTypes')
    .optional(),
  validate,
];

const submitAnswerValidation = [
  body('questionId').isMongoId().withMessage('Invalid question ID format'),
  body('answerText').optional().isString(),
  body('timeTaken').optional().isNumeric(),
  body('skipped').optional().isBoolean(),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createInterviewValidation,
  submitAnswerValidation,
};
