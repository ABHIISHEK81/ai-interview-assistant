const AppError = require('../utils/AppError');

/**
 * Granular RBAC Permissions Map per PDF pp. 1650-1700
 */
const PERMISSIONS = {
  'view:users': ['admin', 'support'],
  'update:users': ['admin', 'support'],
  'view:jobs': ['admin', 'content_manager'],
  'create:jobs': ['admin', 'content_manager'],
  'update:jobs': ['admin', 'content_manager'],
  'delete:jobs': ['admin', 'content_manager'],
  'view:templates': ['admin', 'content_manager'],
  'create:templates': ['admin', 'content_manager'],
  'update:templates': ['admin', 'content_manager'],
  'delete:templates': ['admin', 'content_manager'],
  'view:payments': ['admin', 'support'],
  'refund:payments': ['support'],
  'view:scraper': ['admin', 'content_manager'],
  'run:scraper': ['admin', 'content_manager'],
  'view:prompts': ['admin'],
  'update:prompts': ['admin'],
  'view:logs': ['admin', 'support'],
  'view:analytics': ['admin'],
  'view:settings': ['admin'],
  'update:settings': ['admin'],
};

/**
 * Require specific permission or wildcard super_admin
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    const admin = req.admin || req.user;
    if (!admin) {
      return next(new AppError('Authentication required', 401));
    }

    // super_admin has wildcard (*) access to every action
    if (admin.role === 'super_admin') {
      return next();
    }

    const allowedRoles = PERMISSIONS[permission] || [];
    if (allowedRoles.includes(admin.role)) {
      return next();
    }

    return next(
      new AppError(
        `Forbidden: Role "${admin.role}" does not have "${permission}" permission.`,
        403
      )
    );
  };
};

/**
 * Restrict action exclusively to super_admin (e.g. deleting users) per PDF p. 1655
 */
const requireSuperAdmin = (req, res, next) => {
  const admin = req.admin || req.user;
  if (!admin || admin.role !== 'super_admin') {
    return next(
      new AppError('Forbidden: This action requires super_admin privilege.', 403)
    );
  }
  next();
};

module.exports = {
  PERMISSIONS,
  requirePermission,
  requireSuperAdmin,
};
