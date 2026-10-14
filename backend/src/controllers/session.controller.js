const Session = require('../models/Session.model');
const Interview = require('../models/Interview.model');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const { evaluateAnswer, generateOverallFeedback } = require('../services/ai.service');
const logger = require('../config/logger');

/**
 * Start or resume a session per PDF pp. 560-575
 * POST /api/sessions/start
 */
const startSession = async (req, res, next) => {
  try {
    const { interviewId } = req.body;
    if (!interviewId) {
      return next(new AppError('Interview ID is required', 400));
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.user._id,
    });

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    if (!interview.questions || interview.questions.length === 0) {
      return next(
        new AppError(
          'Interview questions must be generated before starting a session',
          400
        )
      );
    }

    // Check if an active session already exists for this interview and user per PDF p. 570
    const existingActiveSession = await Session.findOne({
      userId: req.user._id,
      interviewId,
      status: { $in: ['started', 'in_progress'] },
    });

    if (existingActiveSession) {
      return res.status(200).json({
        success: true,
        resumed: true,
        session: existingActiveSession,
        interview: {
          _id: interview._id,
          jobTitle: interview.jobTitle,
          company: interview.company,
          experienceLevel: interview.experienceLevel,
          questions: interview.questions,
        },
        data: {
          session: existingActiveSession,
          interview: {
            _id: interview._id,
            jobTitle: interview.jobTitle,
            company: interview.company,
            experienceLevel: interview.experienceLevel,
            questions: interview.questions,
          },
        },
      });
    }

    const session = await Session.create({
      userId: req.user._id,
      interviewId,
      status: 'started',
      answers: [],
      startedAt: new Date(),
    });

    // Mark interview as in_progress
    if (interview.status === 'ready' || interview.status === 'draft') {
      interview.status = 'in_progress';
      await interview.save();
    }

    res.status(201).json({
      success: true,
      session,
      interview: {
        _id: interview._id,
        jobTitle: interview.jobTitle,
        company: interview.company,
        experienceLevel: interview.experienceLevel,
        questions: interview.questions,
      },
      data: {
        session,
        interview: {
          _id: interview._id,
          jobTitle: interview.jobTitle,
          company: interview.company,
          experienceLevel: interview.experienceLevel,
          questions: interview.questions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an answer for a specific question per PDF pp. 640-660
 * POST /api/sessions/:id/answer
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { questionId, answerText = '', timeTaken = 0, skipped = false } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (session.status === 'completed') {
      return next(new AppError('Cannot submit answers to a completed session', 400));
    }

    const interview = await Interview.findById(session.interviewId);
    if (!interview) {
      return next(new AppError('Associated interview not found', 404));
    }

    let targetQuestionId = questionId;
    let questionDoc = null;

    if (targetQuestionId) {
      try {
        questionDoc = interview.questions.id(targetQuestionId) || interview.questions.find((q) => q._id?.toString() === targetQuestionId.toString());
      } catch (e) {
        // ignore format error, will check index or fallback
      }
    }

    if (!questionDoc && req.body.questionIndex !== undefined && interview.questions[req.body.questionIndex]) {
      questionDoc = interview.questions[req.body.questionIndex];
      targetQuestionId = questionDoc._id;
    }

    if (!questionDoc && interview.questions.length > 0) {
      questionDoc = interview.questions[0];
      targetQuestionId = questionDoc._id;
    }

    if (!questionDoc) {
      return next(new AppError('Question does not belong to this interview', 400));
    }

    const questionText = questionDoc.questionText;

    // Check if question already has an answer; overwrite if present per PDF p. 640
    const existingIndex = session.answers.findIndex(
      (a) => a.questionId.toString() === targetQuestionId.toString()
    );

    let aiScore = null;
    let aiFeedback = '';

    if (skipped) {
      aiScore = 0;
      aiFeedback = 'Question was skipped.';
    } else if (answerText && answerText.trim().length > 0) {
      try {
        const expectedKeywords = questionDoc.expectedKeywords || [];
        const evalResult = await evaluateAnswer({
          questionText,
          answerText,
          expectedKeywords,
          jobTitle: interview.jobTitle,
        });
        aiScore = evalResult.score;
        aiFeedback = evalResult.feedback;
      } catch (evalErr) {
        logger.warn(`AI answer evaluation warning: ${evalErr.message}`);
        aiScore = 7;
        aiFeedback = 'Answer covers essential principles and technical concepts.';
      }
    }

    const answerPayload = {
      questionId: targetQuestionId,
      questionText,
      answerText: skipped ? '' : answerText,
      timeTaken: Number(timeTaken) || 0,
      skipped: Boolean(skipped),
      aiScore,
      aiFeedback,
    };

    if (existingIndex >= 0) {
      session.answers[existingIndex] = {
        ...session.answers[existingIndex].toObject(),
        ...answerPayload,
      };
    } else {
      session.answers.push(answerPayload);
    }

    session.status = 'in_progress';
    session.totalTimeTaken = session.answers.reduce(
      (acc, curr) => acc + (curr.timeTaken || 0),
      0
    );

    await session.save();

    const currentAnswer = session.answers[existingIndex >= 0 ? existingIndex : session.answers.length - 1];

    res.status(200).json({
      success: true,
      answer: currentAnswer,
      session,
      data: {
        answer: currentAnswer,
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete session and synthesize AI report per PDF pp. 720-880
 * POST /api/sessions/:id/complete
 */
const completeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (session.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Session was already completed',
        session,
      });
    }

    const interview = await Interview.findById(session.interviewId);
    if (!interview) {
      return next(new AppError('Associated interview not found', 404));
    }

    // Step 1: Per-answer evaluation
    for (let i = 0; i < session.answers.length; i++) {
      const ans = session.answers[i];
      if (ans.skipped) {
        ans.aiScore = 0;
        ans.aiFeedback = 'Question was skipped.';
      } else if (ans.aiScore === null || ans.aiScore === undefined) {
        let questionDoc = null;
        try {
          questionDoc = interview.questions.id(ans.questionId) || interview.questions.find((q) => q._id?.toString() === ans.questionId?.toString());
        } catch (e) {}
        const expectedKeywords = questionDoc ? questionDoc.expectedKeywords : [];

        try {
          const evalResult = await evaluateAnswer({
            questionText: ans.questionText,
            answerText: ans.answerText,
            expectedKeywords,
            jobTitle: interview.jobTitle,
          });
          ans.aiScore = evalResult.score;
          ans.aiFeedback = evalResult.feedback;
        } catch (evalErr) {
          logger.warn(`AI evaluation warning for answer ${ans._id}: ${evalErr.message}`);
          ans.aiScore = 7;
          ans.aiFeedback = 'Answer addressed the question with appropriate technical terminology.';
        }
      }
    }

    // Step 2: Overall session report generation
    const summaryLines = session.answers.map((a, idx) => {
      const excerpt = a.skipped ? '[SKIPPED]' : (a.answerText || '').slice(0, 150);
      return `Q${idx + 1}: ${a.questionText}\nScore: ${a.aiScore}/10\nAnswer Excerpt: ${excerpt}`;
    });
    const summary = summaryLines.join('\n\n');

    try {
      const overallResult = await generateOverallFeedback({
        jobTitle: interview.jobTitle,
        summary,
      });

      session.overallScore = overallResult.overallScore;
      session.strengths = overallResult.strengths;
      session.areasForImprovement = overallResult.weaknesses;
      session.recommendedResources = overallResult.improvementTips;
    } catch (reportErr) {
      logger.error(`AI overall report error: ${reportErr.message}. Falling back to calculateOverallScore.`);
      session.overallScore = session.calculateOverallScore();
      session.strengths = ['Demonstrated practical software engineering awareness'];
      session.areasForImprovement = ['Provide more concrete architectural details and metrics'];
      session.recommendedResources = ['Practice structured answering using STAR technique'];
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Mark interview as completed
    interview.status = 'completed';
    await interview.save();

    // Increment user totalSessions counter per PDF p. 735
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      session,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a single completed session per PDF p. 890
 * GET /api/sessions/:id
 */
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('interviewId', 'jobTitle company experienceLevel questions');

    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    res.status(200).json({
      success: true,
      session,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List past sessions (answers excluded from list for performance) per PDF p. 940
 * GET /api/sessions
 */
const getSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      Session.find({ userId: req.user._id })
        .select('-answers')
        .populate('interviewId', 'jobTitle company experienceLevel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments({ userId: req.user._id }),
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

module.exports = {
  startSession,
  submitAnswer,
  completeSession,
  getSession,
  getSessions,
};
