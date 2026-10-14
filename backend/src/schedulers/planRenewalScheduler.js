const cron = require('node-cron');
const User = require('../models/User.model');
const Plan = require('../models/Plan.model');
const logger = require('../config/logger');

/**
 * Process monthly credit refills and subscription expiries
 */
const runPlanRenewalCycle = async () => {
  try {
    const now = new Date();

    // 1. Process 3-Months plan monthly distributions (10 credits / month, strict no rollover)
    const threeMonthUsersDue = await User.find({
      plan: '3-months',
      isPremium: true,
      creditsExpiresAt: { $lte: now },
      planExpiresAt: { $gt: now },
    });

    for (const user of threeMonthUsersDue) {
      if (user.monthsRemainingInPlan > 1) {
        // Expire previous unused credits
        const previousCredits = user.credits;
        user.credits = 10; // Fresh 10 credits for new monthly cycle
        user.monthsRemainingInPlan -= 1;
        user.creditsExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.creditsRenewAt = user.creditsExpiresAt;
        await user.save();
        logger.info(
          `[PlanRenewal] Advanced 3-month plan for ${user.email}: Expired ${previousCredits} unused credits, allocated fresh 10 credits. Remaining months: ${user.monthsRemainingInPlan}`
        );
      } else {
        // Final month finished
        user.credits = 0;
        user.monthsRemainingInPlan = 0;
        await user.save();
        logger.info(`[PlanRenewal] 3-month plan finished for ${user.email}. Credits reset to 0.`);
      }
    }

    // 2. Expire unused credits for users on 1-month plan or free trial whose monthly validity has passed
    const expiredCreditUsers = await User.find({
      plan: { $in: ['free', '1-month', 'basic', 'medium', 'advanced'] },
      creditsExpiresAt: { $lte: now },
      credits: { $gt: 0 },
    });

    for (const user of expiredCreditUsers) {
      const expiredAmount = user.credits;
      user.credits = 0;
      await user.save();
      logger.info(
        `[PlanRenewal] Expired ${expiredAmount} unused credits for user ${user.email} (monthly validity cycle ended).`
      );
    }

    // 3. Process expired paid subscriptions (1-month, 3-months, 1-year)
    const expiredSubscriptions = await User.find({
      isPremium: true,
      planExpiresAt: { $lte: now },
    });

    for (const user of expiredSubscriptions) {
      user.isPremium = false;
      user.hasDirectAccess = false;
      user.plan = 'free';
      user.planId = null;
      user.planExpiresAt = null;
      user.creditsExpiresAt = null;
      user.creditsRenewAt = null;
      user.credits = 0;
      await user.save();

      logger.info(`[PlanRenewal] Subscription expired for user ${user.email}. Downgraded to free starter with 0 credits.`);
    }

    logger.info(
      `[PlanRenewal] Renewal cycle completed. 3-mo cycles: ${threeMonthUsersDue.length}, Expired credits: ${expiredCreditUsers.length}, Expired subs: ${expiredSubscriptions.length}`
    );
  } catch (error) {
    logger.error(`[PlanRenewal] Scheduler error: ${error.message}`);
  }
};

/**
 * Initialize daily renewal cron scheduler
 */
const initPlanRenewalScheduler = () => {
  // Run daily at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', () => {
    logger.info('[PlanRenewal] Starting daily subscription renewal and credit refill check...');
    runPlanRenewalCycle();
  });

  // Run initial boot check after 45 seconds to avoid startup lock
  setTimeout(() => {
    logger.info('[PlanRenewal] Running initial boot subscription check...');
    runPlanRenewalCycle();
  }, 45000);

  logger.info('[PlanRenewal] Subscription renewal scheduler registered (daily at midnight).');
};

module.exports = {
  initPlanRenewalScheduler,
  runPlanRenewalCycle,
};
