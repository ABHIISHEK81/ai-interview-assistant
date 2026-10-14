const User = require('../models/User.model');
const Interview = require('../models/Interview.model');
const Session = require('../models/Session.model');
const Resume = require('../models/Resume.model');
const AppError = require('../utils/AppError');

/**
 * Update candidate profile
 * PATCH /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

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
 * Change candidate password
 * PATCH /api/users/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide both current and new password', 400));
    }

    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters long', 400));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Incorrect current password', 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get candidate dashboard stats
 * GET /api/users/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [interviewCount, sessionCount, resumeCount, completedSessions] =
      await Promise.all([
        Interview.countDocuments({ userId }),
        Session.countDocuments({ userId }),
        Resume.countDocuments({ userId }),
        Session.find({ userId, status: 'completed' }).select('overallScore completedAt'),
      ]);

    let averageScore = 0;
    if (completedSessions.length > 0) {
      const validScores = completedSessions
        .map((s) => s.overallScore)
        .filter((sc) => sc !== null && sc !== undefined);
      if (validScores.length > 0) {
        averageScore = Math.round(
          validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
        );
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalInterviews: interviewCount,
        totalSessions: sessionCount,
        totalResumes: resumeCount,
        averageScore,
        credits: req.user.credits !== undefined ? req.user.credits : 2,
        isPremium: req.user.isPremium || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  changePassword,
  getUserStats,
};
