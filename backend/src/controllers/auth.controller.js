const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const {
  sendTokenResponse,
  verifyRefreshToken,
  generateAccessToken,
} = require('../utils/jwt.utils');

/**
 * Register candidate per PDF pp. 1500-1510
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('An account with this email already exists', 400));
    }

    // Strictly limit to 1 registration/credit claim per unique email address to prevent abuse
    const CreditClaimLog = require('../models/CreditClaimLog.model');
    const existingClaim = await CreditClaimLog.findOne({ email: normalizedEmail });

    let creditsToAward = 2;
    let freeTrialClaimed = true;
    const now = new Date();
    const creditsExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days monthly cycle

    if (existingClaim) {
      creditsToAward = 0;
      freeTrialClaimed = false;
    }

    const user = await User.create({
      name: (name || '').trim(),
      email: normalizedEmail,
      password,
      role: 'candidate',
      credits: creditsToAward,
      freeTrialClaimed,
      freeTrialClaimedAt: freeTrialClaimed ? now : null,
      creditsExpiresAt: freeTrialClaimed ? creditsExpiresAt : null,
      monthlyCreditAllowance: 2,
      plan: 'free',
    });

    if (freeTrialClaimed) {
      await CreditClaimLog.create({
        email: normalizedEmail,
        userId: user._id,
        creditsClaimed: 2,
        ipAddress: req.ip,
        claimedAt: now,
      });
    }

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Login candidate per PDF pp. 1510-1520
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 403)
      );
    }

    if (user.isBanned) {
      return next(new AppError('Your account has been banned.', 403));
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token per PDF p. 1525
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return next(new AppError('Refresh token is required', 400));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile per PDF p. 1530
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unified OAuth 2.0 handler (Google, LinkedIn, GitHub)
 * POST /api/auth/oauth
 */
const oauthAuth = async (req, res, next) => {
  try {
    const { provider, profile } = req.body;
    const validProviders = ['google', 'linkedin', 'github'];

    if (!provider || !validProviders.includes(provider.toLowerCase())) {
      return next(new AppError(`Invalid OAuth provider. Must be one of: ${validProviders.join(', ')}`, 400));
    }

    const providerKey = provider.toLowerCase();

    // Extract user profile information
    const email = profile?.email;
    const name = profile?.name;
    const avatar = profile?.avatar;
    const providerId = profile?.providerId || profile?.id || profile?.sub;

    if (!email) {
      return next(new AppError('OAuth profile must include a valid email address', 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(providerId ? [{ providerId, authProvider: providerKey }] : []),
      ],
    }).select('+password');

    let isNewUser = false;

    if (user) {
      // Check account status
      if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 403));
      }
      if (user.isBanned) {
        return next(new AppError('Your account has been banned.', 403));
      }

      // Link provider if needed
      let modified = false;
      if (!user.providerId && providerId) {
        user.providerId = providerId;
        modified = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (modified) {
        await user.save({ validateBeforeSave: false });
      }
    } else {
      isNewUser = true;
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';

      // Strictly limit to 1 registration/credit claim per unique email address
      const CreditClaimLog = require('../models/CreditClaimLog.model');
      const existingClaim = await CreditClaimLog.findOne({ email: normalizedEmail });

      let creditsToAward = 2;
      let freeTrialClaimed = true;
      const now = new Date();
      const creditsExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days monthly cycle

      if (existingClaim) {
        creditsToAward = 0;
        freeTrialClaimed = false;
      }

      user = await User.create({
        name: (name || `${providerKey.charAt(0).toUpperCase() + providerKey.slice(1)} User`).trim(),
        email: normalizedEmail,
        password: randomPassword,
        role: 'candidate',
        authProvider: providerKey,
        providerId: providerId || `${providerKey}_${Date.now()}`,
        avatar: avatar || null,
        credits: creditsToAward,
        freeTrialClaimed,
        freeTrialClaimedAt: freeTrialClaimed ? now : null,
        creditsExpiresAt: freeTrialClaimed ? creditsExpiresAt : null,
        monthlyCreditAllowance: 2,
        plan: 'free',
      });

      if (freeTrialClaimed) {
        await CreditClaimLog.create({
          email: normalizedEmail,
          userId: user._id,
          creditsClaimed: 2,
          ipAddress: req.ip,
          claimedAt: now,
        });
      }
    }

    await sendTokenResponse(user, isNewUser ? 201 : 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * OAuth browser redirect endpoint
 * GET /api/auth/:provider
 */
const getOAuthRedirect = async (req, res, next) => {
  const provider = (req.params.provider || '').toLowerCase();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!['google', 'linkedin', 'github'].includes(provider)) {
    return next(new AppError('Unsupported OAuth provider', 400));
  }

  // Redirect to client-side OAuth flow
  res.redirect(`${clientUrl}/login?oauth_provider=${provider}`);
};

/**
 * Logout per PDF p. 1535
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  oauthAuth,
  getOAuthRedirect,
  refreshToken,
  getMe,
  logout,
};
