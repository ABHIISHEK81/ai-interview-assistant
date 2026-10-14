const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Please log in to access this resource', 401)
      );
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    if (!user.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 403)
      );
    }

    if (user.isBanned) {
      return next(new AppError('Your account has been banned.', 403));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password. Please log in again.', 401)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
