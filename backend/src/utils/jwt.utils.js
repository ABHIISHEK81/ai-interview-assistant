const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev_jwt_secret_key_12345', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_67890',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_key_12345');
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_67890'
  );
};

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token on user document for invalidation on logout
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    authProvider: user.authProvider || 'local',
    totalSessions: user.totalSessions || 0,
    credits: user.credits !== undefined ? user.credits : 2,
    creditsExpiresAt: user.creditsExpiresAt || null,
    plan: user.plan || 'free',
    isPremium: user.isPremium || false,
    freeTrialClaimed: user.freeTrialClaimed || false,
    hasDirectAccess: user.hasDirectAccess || false,
    monthsRemainingInPlan: user.monthsRemainingInPlan || 0,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: userData,
    data: {
      accessToken,
      refreshToken,
      user: userData,
    },
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sendTokenResponse,
};
