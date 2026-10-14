const express = require('express');
const {
  getMockTestTemplates,
  generateMockTest,
  evaluateMockTest,
  getMockTestHistory,
} = require('../controllers/mockTest.controller');
const { protect } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../services/cache.service');

const router = express.Router();

router.use(protect); // All mock test operations require authentication

router.get('/templates', cacheMiddleware(120), getMockTestTemplates);
router.post('/generate', generateMockTest);
router.post('/evaluate', evaluateMockTest);
router.get('/history', getMockTestHistory);

module.exports = router;
