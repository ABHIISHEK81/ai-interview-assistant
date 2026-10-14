const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User.model');

const ADMIN_ROLES = ['admin', 'super_admin', 'content_manager', 'support'];

/**
 * Admin authentication middleware per PDF pp. 1540-1550
 * Validates admin bearer token and enforces non-candidate role.
 */
const protectAdmin = async (req, res, next) => {
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
        new AppError('Please log in with admin credentials to access this resource', 401)
      );
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired admin token', 401));
    }

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Role check: must have admin-level role
    if (!ADMIN_ROLES.includes(user.role)) {
      return next(
        new AppError('Access denied. Admin privileges required.', 403)
      );
    }

    if (!user.isActive) {
      return next(
        new AppError('Admin account has been deactivated.', 403)
      );
    }

    if (user.isBanned) {
      return next(new AppError('Admin account has been banned.', 403));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('Password was recently changed. Please log in again.', 401)
      );
    }

    req.admin = user;
    req.user = user; // Set req.user for compatibility
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protectAdmin,
  ADMIN_ROLES,
};
