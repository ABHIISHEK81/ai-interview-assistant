const Stripe = require('stripe');
const Plan = require('../models/Plan.model');
const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
const logger = require('../config/logger');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key';
const isMockStripe = !stripeSecretKey || stripeSecretKey.includes('mock') || !stripeSecretKey.startsWith('sk_');

let stripe = null;
if (!isMockStripe) {
  try {
    stripe = new Stripe(stripeSecretKey);
  } catch (err) {
    logger.warn(`Stripe init fallback to test simulation: ${err.message}`);
    stripe = null;
  }
}

/**
 * Get all active plans sorted by hierarchy
 */
const getPlans = async () => {
  return await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
};

/**
 * Create checkout session (Stripe Test Mode / Mock Zero-Cost Fallback)
 */
const createCheckoutSession = async ({ user, planId, billingCycle = 'monthly', successUrl, cancelUrl }) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Selected plan not found');
  }

  if (plan.name === 'free') {
    throw new Error('Free plan does not require checkout');
  }

  const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Real Stripe Test Mode
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `InterviewAI ${plan.displayName}`,
                description: `${plan.creditQuota} Mock Interview Sessions per month`,
              },
              unit_amount: amount * 100, // Stripe expects paise
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: user.email,
        client_reference_id: user._id.toString(),
        metadata: {
          planId: plan._id.toString(),
          planName: plan.name,
          billingCycle,
        },
        success_url: successUrl || `${clientUrl}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${clientUrl}/pricing?status=canceled`,
      });

      // Create pending transaction record
      await Transaction.create({
        userId: user._id,
        planId: plan._id,
        planName: plan.name,
        amount,
        currency: 'INR',
        status: 'pending',
        billingCycle,
        creditsAdded: plan.creditQuota,
        stripeSessionId: session.id,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
        plan: plan.name,
        amount,
      };
    } catch (err) {
      logger.warn(`Stripe checkout session creation failed, using test simulation: ${err.message}`);
    }
  }

  // Zero-Cost Test Mode Simulation
  const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await Transaction.create({
    userId: user._id,
    planId: plan._id,
    planName: plan.name,
    amount,
    currency: 'INR',
    status: 'pending',
    billingCycle,
    creditsAdded: plan.creditQuota,
    stripeSessionId: mockSessionId,
  });

  return {
    sessionId: mockSessionId,
    checkoutUrl: `${clientUrl}/pricing?status=success&session_id=${mockSessionId}&test_mode=true`,
    plan: plan.name,
    amount,
  };
};

/**
 * Helper to compute plan validity and credit parameters
 */
const getPlanConfig = (plan, requestedCycle = 'monthly') => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (plan.name === '1-month') {
    return {
      amount: 249,
      credits: 10,
      monthlyCreditAllowance: 10,
      monthsRemainingInPlan: 1,
      hasDirectAccess: false,
      billingCycle: 'monthly',
      planExpiresAt: new Date(now + 30 * ONE_DAY),
      creditsExpiresAt: new Date(now + 30 * ONE_DAY),
    };
  }

  if (plan.name === '3-months') {
    return {
      amount: 449,
      credits: 10, // First monthly allotment of 10 credits (30 total distributed across 3 months)
      monthlyCreditAllowance: 10,
      monthsRemainingInPlan: 3,
      hasDirectAccess: false,
      billingCycle: 'quarterly',
      planExpiresAt: new Date(now + 90 * ONE_DAY),
      creditsExpiresAt: new Date(now + 30 * ONE_DAY), // First 30-day cycle
    };
  }

  if (plan.name === '1-year') {
    return {
      amount: 2500,
      credits: 120, // Generous Direct Access / Annual Pool
      monthlyCreditAllowance: 10,
      monthsRemainingInPlan: 12,
      hasDirectAccess: true, // Continuous platform access
      billingCycle: 'annual',
      planExpiresAt: new Date(now + 365 * ONE_DAY),
      creditsExpiresAt: new Date(now + 365 * ONE_DAY),
    };
  }

  // Legacy fallback (basic, medium, advanced)
  const isAnnual = requestedCycle === 'annual';
  const durationDays = isAnnual ? 365 : 30;
  return {
    amount: isAnnual ? plan.priceAnnual : plan.priceMonthly,
    credits: plan.creditQuota,
    monthlyCreditAllowance: plan.creditQuota,
    monthsRemainingInPlan: isAnnual ? 12 : 1,
    hasDirectAccess: false,
    billingCycle: requestedCycle,
    planExpiresAt: new Date(now + durationDays * ONE_DAY),
    creditsExpiresAt: new Date(now + 30 * ONE_DAY),
  };
};

/**
 * Handle Stripe Webhook / Simulated Webhook Event
 */
const handleWebhookEvent = async (event) => {
  const session = event.data?.object;
  if (!session) return { received: true };

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const sessionId = session.id;
    const userId = session.client_reference_id || session.metadata?.userId;
    const planName = session.metadata?.planName;
    const billingCycle = session.metadata?.billingCycle || 'monthly';

    if (userId && planName) {
      const plan = await Plan.findOne({ name: planName });
      if (plan) {
        const config = getPlanConfig(plan, billingCycle);

        // Update candidate user
        await User.findByIdAndUpdate(userId, {
          plan: plan.name,
          planId: plan._id,
          isPremium: plan.name !== 'free',
          billingCycle: config.billingCycle,
          planExpiresAt: config.planExpiresAt,
          creditsExpiresAt: config.creditsExpiresAt,
          creditsRenewAt: config.creditsExpiresAt,
          monthlyCreditAllowance: config.monthlyCreditAllowance,
          monthsRemainingInPlan: config.monthsRemainingInPlan,
          hasDirectAccess: config.hasDirectAccess,
          credits: config.credits,
        });

        // Mark transaction completed
        await Transaction.findOneAndUpdate(
          { stripeSessionId: sessionId },
          { status: 'completed' }
        );

        logger.info(`[Billing] Upgraded user ${userId} to ${plan.name} via webhook. Refilled ${config.credits} credits.`);
      }
    }
  }

  return { received: true };
};

/**
 * Instant Upgrade for Test Mode & Development QA
 */
const applyTestUpgrade = async ({ userId, planName, billingCycle = 'monthly' }) => {
  const plan = await Plan.findOne({ name: planName.toLowerCase() });
  if (!plan) {
    throw new Error(`Plan ${planName} not found`);
  }

  const config = getPlanConfig(plan, billingCycle);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      plan: plan.name,
      planId: plan._id,
      isPremium: plan.name !== 'free',
      billingCycle: config.billingCycle,
      planExpiresAt: config.planExpiresAt,
      creditsExpiresAt: config.creditsExpiresAt,
      creditsRenewAt: config.creditsExpiresAt,
      monthlyCreditAllowance: config.monthlyCreditAllowance,
      monthsRemainingInPlan: config.monthsRemainingInPlan,
      hasDirectAccess: config.hasDirectAccess,
      credits: config.credits,
    },
    { new: true }
  ).select('name email credits plan isPremium planExpiresAt creditsExpiresAt billingCycle monthsRemainingInPlan hasDirectAccess');

  const transaction = await Transaction.create({
    userId,
    planId: plan._id,
    planName: plan.name,
    amount: config.amount,
    currency: 'INR',
    status: 'completed',
    billingCycle: config.billingCycle,
    creditsAdded: config.credits,
    stripeSessionId: `cs_test_mock_${Date.now()}`,
    metadata: { testMode: true },
  });

  logger.info(`[Billing Test] User ${userId} upgraded to ${plan.name} (INR ₹${config.amount}). Credits added: ${config.credits}. New balance: ${user.credits}`);

  return { user, plan, transaction };
};

/**
 * Get Candidate's Billing Status & Transaction History
 */
const getUserBillingStatus = async (userId) => {
  const user = await User.findById(userId).populate('planId');
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10);

  return {
    plan: user?.plan || 'free',
    planDetails: user?.planId,
    credits: user?.credits ?? 2,
    creditsExpiresAt: user?.creditsExpiresAt,
    freeTrialClaimed: user?.freeTrialClaimed || false,
    monthsRemainingInPlan: user?.monthsRemainingInPlan || 0,
    hasDirectAccess: user?.hasDirectAccess || false,
    isPremium: user?.isPremium || false,
    planExpiresAt: user?.planExpiresAt,
    creditsRenewAt: user?.creditsRenewAt,
    billingCycle: user?.billingCycle,
    transactions,
  };
};

/**
 * Cancel Plan Subscription at end of cycle
 */
const cancelSubscription = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { billingCycle: null },
    { new: true }
  ).select('name email plan credits billingCycle planExpiresAt');

  logger.info(`[Billing] User ${userId} canceled subscription auto-renewal.`);
  return user;
};

module.exports = {
  getPlans,
  createCheckoutSession,
  handleWebhookEvent,
  applyTestUpgrade,
  getUserBillingStatus,
  cancelSubscription,
};
