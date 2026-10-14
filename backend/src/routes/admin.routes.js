const express = require('express');
const {
  adminLogin,
  adminRefreshToken,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  bulkUserAction,
  getInterviews,
  deleteInterview,
  getSessions,
  deleteSession,
  getResumes,
  deleteResume,
  getPrompts,
  updatePrompt,
  rollbackPrompt,
  getTemplates,
  createTemplate,
  deleteTemplate,
  getPlatformAnalytics,
  getMonthlyReports,
  compileMonthlyReport,
  downloadMonthlyReport,
  exportMonthExcel,
} = require('../controllers/admin.controller');
const { protectAdmin } = require('../middleware/adminAuth.middleware');
const { requirePermission, requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

// 1. Admin Authentication (Public)
router.post('/auth/login', adminLogin);
router.post('/auth/refresh', adminRefreshToken);

// Protect all following routes with admin bearer JWT
router.use(protectAdmin);

// 2. Platform Analytics & Dashboard
router.get('/analytics', requirePermission('view:analytics'), getPlatformAnalytics);
router.get('/stats', requirePermission('view:analytics'), getPlatformAnalytics);

// 3. User Management
router.get('/users', requirePermission('view:users'), getUsers);
router.get('/users/:id', requirePermission('view:users'), getUser);
router.patch('/users/:id', requirePermission('update:users'), updateUser);
router.delete('/users/:id', requireSuperAdmin, deleteUser);
router.post('/users/bulk', requirePermission('update:users'), bulkUserAction);

// 4. Interviews & Sessions Management
router.get('/interviews', requirePermission('view:users'), getInterviews);
router.delete('/interviews/:id', requirePermission('update:users'), deleteInterview);
router.get('/sessions', requirePermission('view:users'), getSessions);
router.delete('/sessions/:id', requirePermission('update:users'), deleteSession);

// 5. Resume Management
router.get('/resumes', requirePermission('view:users'), getResumes);
router.delete('/resumes/:id', requirePermission('update:users'), deleteResume);

// 6. System Prompts & Versioning
router.get('/prompts', requirePermission('view:prompts'), getPrompts);
router.patch('/prompts/:id', requirePermission('update:prompts'), updatePrompt);
router.post('/prompts/:id/rollback', requirePermission('update:prompts'), rollbackPrompt);

// 7. Reusable Interview Templates
router.get('/templates', requirePermission('view:templates'), getTemplates);
router.post('/templates', requirePermission('create:templates'), createTemplate);
router.delete('/templates/:id', requirePermission('delete:templates'), deleteTemplate);

// 8. Monthly Analytics & Excel Reports
router.get('/reports', requirePermission('view:analytics'), getMonthlyReports);
router.post('/reports/compile', requirePermission('view:analytics'), compileMonthlyReport);
router.get('/reports/:id/download', requirePermission('view:analytics'), downloadMonthlyReport);
router.get('/reports/export/:year/:month', requirePermission('view:analytics'), exportMonthExcel);

module.exports = router;

