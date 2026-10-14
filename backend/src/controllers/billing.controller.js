const billingService = require('../services/billing.service');
const AppError = require('../utils/AppError');

/**
 * GET /api/billing/plans
 * List all active paid plans
 */
const getPlans = async (req, res, next) => {
  try {
    const plans = await billingService.getPlans();
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/status
 * Get candidate's billing status, plan expiry, credits, and history
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await billingService.getUserBillingStatus(req.user._id);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/checkout
 * Create Stripe Checkout Session (Test Mode / Zero-Cost Simulation)
 */
const createCheckout = async (req, res, next) => {
  try {
    const { planId, billingCycle = 'monthly', successUrl, cancelUrl } = req.body;

    if (!planId) {
      return next(new AppError('Please provide a planId', 400));
    }

    const sessionData = await billingService.createCheckoutSession({
      user: req.user,
      planId,
      billingCycle,
      successUrl,
      cancelUrl,
    });

    res.status(200).json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/webhook
 * Idempotent Stripe Webhook Handler
 */
const handleWebhook = async (req, res, next) => {
  try {
    const result = await billingService.handleWebhookEvent(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/test-upgrade
 * Direct test mode plan upgrade for zero-cost automated verification & QA
 */
const testUpgrade = async (req, res, next) => {
  try {
    const { planName = 'medium', billingCycle = 'monthly' } = req.body;

    const result = await billingService.applyTestUpgrade({
      userId: req.user._id,
      planName,
      billingCycle,
    });

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${result.plan.displayName} (Test Mode)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/cancel
 * Cancel subscription renewal
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const user = await billingService.cancelSubscription(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Subscription renewal has been canceled.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/process-renewals
 * Execute plan renewal and credit expiration cycle on demand
 */
const processRenewals = async (req, res, next) => {
  try {
    const { runPlanRenewalCycle } = require('../schedulers/planRenewalScheduler');
    await runPlanRenewalCycle();
    res.status(200).json({
      success: true,
      message: 'Plan renewal and credit expiration cycle executed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  getStatus,
  createCheckout,
  handleWebhook,
  testUpgrade,
  cancelSubscription,
  processRenewals,
};
