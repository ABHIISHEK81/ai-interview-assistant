const express = require('express');
const {
  getQuizCategories,
  generateQuiz,
  submitQuiz,
  getLeaderboard,
} = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../services/cache.service');

const router = express.Router();

router.use(protect); // Protected competition routes

router.get('/categories', cacheMiddleware(120), getQuizCategories);
router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/leaderboard', cacheMiddleware(15), getLeaderboard);

module.exports = router;
