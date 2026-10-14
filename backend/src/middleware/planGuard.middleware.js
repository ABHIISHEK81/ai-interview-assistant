const User = require('../models/User.model');
const logger = require('../config/logger');

/**
 * Middleware: Verify user has at least 1 credit before generating interview questions
 */
const requireCredit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Refresh user credit balance and subscription status from database
    const user = await User.findById(req.user._id).select(
      'credits plan isPremium planExpiresAt creditsExpiresAt monthsRemainingInPlan hasDirectAccess'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const now = new Date();

    // Check 1-Year Direct Access
    const isOneYearActive =
      (user.plan === '1-year' || user.hasDirectAccess) &&
      user.planExpiresAt &&
      now <= new Date(user.planExpiresAt);

    if (!isOneYearActive) {
      // Check monthly validity: Credits are bound to a strict monthly cycle.
      // Whether used or unused, credits expire at the end of their respective billing/validity period and do not roll over indefinitely.
      if (user.creditsExpiresAt && now > new Date(user.creditsExpiresAt)) {
        // Multi-month subscription cycle handling (e.g. 3 Months Plan with monthly limits)
        if (
          user.plan === '3-months' &&
          user.monthsRemainingInPlan > 1 &&
          user.planExpiresAt &&
          now <= new Date(user.planExpiresAt)
        ) {
          // Unused credits from previous month expire (strict no rollover rule)
          // Allocate next 10 credits for the new month
          user.credits = 10;
          user.monthsRemainingInPlan -= 1;
          user.creditsExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await user.save();
          logger.info(
            `[Credits] Advanced user ${user._id} to next monthly cycle (10 credits) in 3-month plan. Remaining cycles: ${user.monthsRemainingInPlan}`
          );
        } else {
          // Unused credits expire and do not roll over indefinitely
          if (user.credits > 0) {
            const expiredAmount = user.credits;
            user.credits = 0;
            await user.save();
            logger.info(
              `[Credits] Expired ${expiredAmount} unused credits for user ${user._id} at end of validity period.`
            );
          }
        }
      }
    }

    if (!isOneYearActive && user.credits < 1) {
      return res.status(402).json({
        success: false,
        error:
          'Insufficient or expired interview credits. Unused credits expire at the end of each monthly validity period and do not roll over. Please upgrade or renew your plan to continue.',
        code: 'INSUFFICIENT_CREDITS',
        currentCredits: user.credits,
        plan: user.plan || 'free',
        creditsExpiresAt: user.creditsExpiresAt,
      });
    }

    req.userCredits = user.credits;
    next();
  } catch (error) {
    logger.error(`planGuard error: ${error.message}`);
    next(error);
  }
};

/**
 * Middleware: Verify candidate's active plan meets the required tier
 */
const requirePlan = (allowedPlans = ['basic', 'medium', 'advanced']) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('plan isPremium planExpiresAt');
      const userPlan = user?.plan || 'free';

      if (!allowedPlans.includes(userPlan)) {
        return res.status(403).json({
          success: false,
          error: `This feature is exclusive to ${allowedPlans.join(', ')} plans.`,
          code: 'UPGRADE_REQUIRED',
          currentPlan: userPlan,
          requiredPlans: allowedPlans,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper: Deduct 1 credit from candidate on question generation
 */
const deductUserCredit = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: -1, totalSessions: 1 } },
    { new: true }
  );
  logger.info(`[Credits] Deducted 1 credit for user ${userId}. Remaining credits: ${user?.credits}`);
  return user?.credits;
};

/**
 * Helper: Refund 1 credit to candidate if question generation fails
 */
const refundUserCredit = async (userId, reason = 'Generation failure') => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: 1, totalSessions: -1 } },
    { new: true }
  );
  logger.warn(`[Credits] Refunded 1 credit to user ${userId}. Reason: ${reason}. Remaining credits: ${user?.credits}`);
  return user?.credits;
};

module.exports = {
  requireCredit,
  requirePlan,
  deductUserCredit,
  refundUserCredit,
};
