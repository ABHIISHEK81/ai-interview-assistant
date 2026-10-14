const User = require('../models/User.model');
const Interview = require('../models/Interview.model');
const Session = require('../models/Session.model');
const Resume = require('../models/Resume.model');
const SystemPrompt = require('../models/SystemPrompt.model');
const InterviewTemplate = require('../models/InterviewTemplate.model');
const AppError = require('../utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt.utils');
const { ADMIN_ROLES } = require('../middleware/adminAuth.middleware');
const { DEFAULT_PROMPTS } = require('../services/ai.service');
const logger = require('../config/logger');

const SUPER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@interviewai.com').toLowerCase();

/**
 * Admin Login per PDF pp. 1540-1550
 * POST /api/admin/auth/login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    if (!user.isActive) {
      return next(new AppError('Admin account has been deactivated.', 403));
    }

    if (user.isBanned) {
      return next(new AppError('Admin account has been banned.', 403));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const adminData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      admin: adminData,
      data: {
        accessToken,
        refreshToken,
        admin: adminData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Refresh Token
 * POST /api/admin/auth/refresh
 */
const adminRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Please provide refresh token', 400));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token or session terminated', 401));
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    if (!user.isActive || user.isBanned) {
      return next(new AppError('Admin account is inactive or banned', 403));
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users with pagination and filters per PDF pp. 2350-2370
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (status === 'banned') filter.isBanned = true;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user details with aggregate counters per PDF p. 2360
 * GET /api/admin/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const [interviewCount, sessionCount, resumeCount] = await Promise.all([
      Interview.countDocuments({ userId: user._id }),
      Session.countDocuments({ userId: user._id }),
      Resume.countDocuments({ userId: user._id }),
    ]);

    res.status(200).json({
      success: true,
      user,
      counts: {
        interviewCount,
        sessionCount,
        resumeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user fields (role, active, banned, credits) per PDF pp. 2370-2380
 * PATCH /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Protect super admin account from role change or ban per PDF p. 2375
    const isProtected = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    const { name, role, isActive, isBanned, isPremium, credits, creditsChange, creditsExpiresAt, plan } = req.body;

    if (name) user.name = name;
    if (role && !isProtected) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (isBanned !== undefined && !isProtected) user.isBanned = Boolean(isBanned);
    if (isPremium !== undefined) user.isPremium = Boolean(isPremium);
    if (plan) user.plan = plan;
    if (creditsExpiresAt !== undefined) user.creditsExpiresAt = creditsExpiresAt ? new Date(creditsExpiresAt) : null;

    if (credits !== undefined) {
      user.credits = Math.max(0, parseInt(credits, 10));
    } else if (creditsChange !== undefined) {
      user.credits = Math.max(0, (user.credits || 0) + parseInt(creditsChange, 10));
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cascade delete user per PDF p. 2385 (Super Admin only)
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return next(new AppError('Protected super admin account cannot be deleted.', 403));
    }

    // Cascade delete interviews, sessions, resumes
    await Promise.all([
      Interview.deleteMany({ userId: user._id }),
      Session.deleteMany({ userId: user._id }),
      Resume.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk user actions per PDF pp. 2390-2415
 * POST /api/admin/users/bulk
 */
const bulkUserAction = async (req, res, next) => {
  try {
    const { userIds, action } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError('userIds array is required', 400));
    }

    // Exclude protected super admin from bulk targets
    const superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    const targetIds = superAdmin
      ? userIds.filter((id) => id.toString() !== superAdmin._id.toString())
      : userIds;

    let modifiedCount = 0;

    switch (action) {
      case 'activate':
        const actRes = await User.updateMany({ _id: { $in: targetIds } }, { isActive: true });
        modifiedCount = actRes.modifiedCount;
        break;
      case 'deactivate':
        const deactRes = await User.updateMany({ _id: { $in: targetIds } }, { isActive: false });
        modifiedCount = deactRes.modifiedCount;
        break;
      case 'ban':
        const banRes = await User.updateMany({ _id: { $in: targetIds } }, { isBanned: true });
        modifiedCount = banRes.modifiedCount;
        break;
      case 'unban':
        const unbanRes = await User.updateMany({ _id: { $in: targetIds } }, { isBanned: false });
        modifiedCount = unbanRes.modifiedCount;
        break;
      case 'delete':
        await Promise.all([
          Interview.deleteMany({ userId: { $in: targetIds } }),
          Session.deleteMany({ userId: { $in: targetIds } }),
          Resume.deleteMany({ userId: { $in: targetIds } }),
          User.deleteMany({ _id: { $in: targetIds } }),
        ]);
        modifiedCount = targetIds.length;
        break;
      default:
        return next(new AppError(`Invalid bulk action "${action}"`, 400));
    }

    res.status(200).json({
      success: true,
      message: `Bulk action "${action}" applied to ${modifiedCount} users.`,
      modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all interviews per PDF pp. 2420-2440
 * GET /api/admin/interviews
 */
const getInterviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      Interview.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Interview.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count: interviews.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an interview with cascade sessions per PDF p. 2435
 * DELETE /api/admin/interviews/:id
 */
const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    await Session.deleteMany({ interviewId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Interview and its sessions deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all sessions per PDF pp. 2445-2465
 * GET /api/admin/sessions
 */
const getSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      Session.find()
        .populate('userId', 'name email')
        .populate('interviewId', 'jobTitle company')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session per PDF p. 2465
 * DELETE /api/admin/sessions/:id
 */
const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all resumes per PDF pp. 2470-2475
 * GET /api/admin/resumes
 */
const getResumes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Resume.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count: resumes.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a resume per PDF p. 2475
 * DELETE /api/admin/resumes/:id
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all 5 system prompts per PDF pp. 1950, 2650
 * GET /api/admin/prompts
 */
const getPrompts = async (req, res, next) => {
  try {
    const categories = [
      'resume_parser',
      'ats_scorer',
      'feedback_report',
      'interview',
      'career_coach',
    ];

    // Clean up any legacy removed categories from database
    await SystemPrompt.deleteMany({ category: { $nin: categories } });

    // Ensure all 5 categories exist in database
    for (const cat of categories) {
      const existing = await SystemPrompt.findOne({ category: cat });
      if (!existing) {
        await SystemPrompt.create({
          category: cat,
          name: cat.replace(/_/g, ' ').toUpperCase(),
          description: `System prompt for ${cat}`,
          content: DEFAULT_PROMPTS[cat] || `Default prompt template for ${cat}`,
          version: 1,
          history: [],
        });
      }
    }

    const prompts = await SystemPrompt.find({ category: { $in: categories } }).sort({ category: 1 });

    res.status(200).json({
      success: true,
      count: prompts.length,
      prompts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system prompt with versioning per PDF pp. 1970-2000
 * PATCH /api/admin/prompts/:id
 */
const updatePrompt = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return next(new AppError('Content is required', 400));
    }

    const prompt = await SystemPrompt.findById(req.params.id);
    if (!prompt) {
      return next(new AppError('System prompt not found', 404));
    }

    // Push previous version into history
    prompt.history.push({
      content: prompt.content,
      version: prompt.version,
      updatedBy: req.admin._id,
      updatedAt: new Date(),
    });

    prompt.content = content;
    prompt.version += 1;
    prompt.updatedBy = req.admin._id;
    await prompt.save();

    res.status(200).json({
      success: true,
      message: `System prompt updated to version ${prompt.version}`,
      prompt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback system prompt to a specific version from history
 * POST /api/admin/prompts/:id/rollback
 */
const rollbackPrompt = async (req, res, next) => {
  try {
    const { targetVersion } = req.body;
    const prompt = await SystemPrompt.findById(req.params.id);
    if (!prompt) {
      return next(new AppError('System prompt not found', 404));
    }

    const historyEntry = prompt.history.find((h) => h.version === Number(targetVersion));
    if (!historyEntry) {
      return next(new AppError(`Version ${targetVersion} not found in prompt history`, 404));
    }

    // Save current as history before rollback
    prompt.history.push({
      content: prompt.content,
      version: prompt.version,
      updatedBy: req.admin._id,
      updatedAt: new Date(),
    });

    prompt.content = historyEntry.content;
    prompt.version += 1;
    prompt.updatedBy = req.admin._id;
    await prompt.save();

    res.status(200).json({
      success: true,
      message: `Prompt rolled back to content of version ${targetVersion} (now v${prompt.version})`,
      prompt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List reusable interview templates per PDF pp. 2860-2870
 * GET /api/admin/templates
 */
const getTemplates = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);
    const skip = (page - 1) * limit;

    const { search, difficulty } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;

    const [templates, total] = await Promise.all([
      InterviewTemplate.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InterviewTemplate.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: templates.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create reusable interview template per PDF p. 2876
 * POST /api/admin/templates
 */
const createTemplate = async (req, res, next) => {
  try {
    const {
      name,
      difficulty = 'medium',
      duration = 30,
      questionCount = 5,
      systemPrompt,
      evaluationPrompt,
      feedbackPrompt,
      voiceId = 'alloy',
      voiceSpeed = 1.0,
      voicePitch = 1.0,
      language = 'en',
    } = req.body;

    if (!name || !systemPrompt || !evaluationPrompt || !feedbackPrompt) {
      return next(
        new AppError('name, systemPrompt, evaluationPrompt, and feedbackPrompt are required', 400)
      );
    }

    const template = await InterviewTemplate.create({
      name,
      difficulty,
      duration,
      questionCount,
      systemPrompt,
      evaluationPrompt,
      feedbackPrompt,
      voiceId,
      voiceSpeed,
      voicePitch,
      language,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete template
 * DELETE /api/admin/templates/:id
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await InterviewTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return next(new AppError('Template not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Platform overview statistics and analytics per PDF pp. 2012-2180
 * GET /api/admin/analytics & GET /api/admin/stats
 */
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      premiumUsers,
      totalInterviews,
      interviewsToday,
      totalSessions,
      completedSessions,
      totalResumes,
      recentUsers,
      recentSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isPremium: true }),
      Interview.countDocuments(),
      Interview.countDocuments({ createdAt: { $gte: midnight } }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Resume.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Session.find({ status: 'completed' })
        .populate('userId', 'name email')
        .populate('interviewId', 'jobTitle')
        .sort({ completedAt: -1 })
        .limit(5)
        .select('overallScore completedAt totalTimeTaken'),
    ]);

    // Average overall score across completed sessions
    const completedSessionDocs = await Session.find({ status: 'completed' }).select('overallScore');
    let averageOverallScore = 0;
    if (completedSessionDocs.length > 0) {
      const validScores = completedSessionDocs
        .map((s) => s.overallScore)
        .filter((sc) => sc !== null && sc !== undefined);
      if (validScores.length > 0) {
        averageOverallScore = Math.round(
          validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
        );
      }
    }

    // Compute MAU, Total Visitors, and Drop-Off metrics for current month
    const reportService = require('../services/report.service');
    const now = new Date();
    const currentMonthData = await reportService.getMonthlyAnalytics(now.getFullYear(), now.getMonth() + 1);

    res.status(200).json({
      success: true,
      analytics: {
        mau: currentMonthData.metrics.mau,
        totalVisitors: currentMonthData.metrics.totalVisitors,
        droppedOffUsers: currentMonthData.metrics.droppedOffUsers,
        dropOffRate: currentMonthData.metrics.dropOffRate,
        monthlyInsights: currentMonthData.metrics,
        droppedOffUsersList: currentMonthData.droppedOffUsersList,
        totalUsers,
        totalInterviews,
        totalSessions,
        avgScore: averageOverallScore,
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          premium: premiumUsers,
          mau: currentMonthData.metrics.mau,
          dropOffs: currentMonthData.metrics.droppedOffUsers,
        },
        interviews: {
          total: totalInterviews,
          today: interviewsToday,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          averageScore: averageOverallScore,
        },
        resumes: {
          total: totalResumes,
        },
        recentActivity: {
          recentUsers,
          recentSessions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports
 * List all compiled monthly Excel reports
 */
const getMonthlyReports = async (req, res, next) => {
  try {
    const reportService = require('../services/report.service');
    const reports = await reportService.listMonthlyReports();
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/reports/compile
 * Compile/recompile a monthly Excel performance report
 */
const compileMonthlyReport = async (req, res, next) => {
  try {
    const reportService = require('../services/report.service');
    const now = new Date();
    const year = parseInt(req.body.year || now.getFullYear(), 10);
    const month = parseInt(req.body.month || (now.getMonth() + 1), 10);
    const force = Boolean(req.body.force);

    const report = await reportService.generateMonthlyExcelReport(year, month, { force });

    res.status(200).json({
      success: true,
      message: `Successfully compiled Excel report for ${report.title}`,
      data: {
        _id: report._id,
        year: report.year,
        month: report.month,
        title: report.title,
        fileName: report.fileName,
        metrics: report.metrics,
        generatedAt: report.generatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/:id/download
 * Download a generated Excel spreadsheet report by ID
 */
const downloadMonthlyReport = async (req, res, next) => {
  try {
    const reportService = require('../services/report.service');
    const report = await reportService.getReportById(req.params.id);
    if (!report || !report.excelBufferBase64) {
      return next(new AppError('Report file not found', 404));
    }

    const buffer = Buffer.from(report.excelBufferBase64, 'base64');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.fileName}"`
    );
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/export/:year/:month
 * On-demand stream download for any given month/year
 */
const exportMonthExcel = async (req, res, next) => {
  try {
    const reportService = require('../services/report.service');
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    const report = await reportService.generateMonthlyExcelReport(year, month, { force: req.query.force === 'true' });
    const buffer = Buffer.from(report.excelBufferBase64, 'base64');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.fileName}"`
    );
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
