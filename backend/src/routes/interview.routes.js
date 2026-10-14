const express = require('express');
const {
  createInterview,
  generateInterviewQuestions,
  getInterview,
  getInterviews,
  deleteInterview,
} = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireCredit } = require('../middleware/planGuard.middleware');
const { createInterviewValidation } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // All interview routes are protected

router.post('/', createInterviewValidation, createInterview);
router.post('/:id/generate', requireCredit, generateInterviewQuestions);
router.get('/:id', getInterview);
router.get('/', getInterviews);
router.delete('/:id', deleteInterview);

module.exports = router;
