const express = require('express');
const {
  getPlans,
  getStatus,
  createCheckout,
  handleWebhook,
  testUpgrade,
  cancelSubscription,
  processRenewals,
} = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../services/cache.service');

const router = express.Router();

// Public endpoints (cached for 60 seconds to support high concurrent visitor traffic)
router.get('/plans', cacheMiddleware(60), getPlans);
router.post('/webhook', handleWebhook);

// Protected candidate endpoints
router.use(protect);
router.get('/status', getStatus);
router.post('/checkout', createCheckout);
router.post('/test-upgrade', testUpgrade);
router.post('/cancel', cancelSubscription);
router.post('/process-renewals', processRenewals);

module.exports = router;
