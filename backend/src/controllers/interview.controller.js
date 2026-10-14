const Interview = require('../models/Interview.model');
const Resume = require('../models/Resume.model');
const Session = require('../models/Session.model');
const AppError = require('../utils/AppError');
const { retrieveRAGContext } = require('../services/rag.service');
const { generateQuestions } = require('../services/ai.service');
const { deductUserCredit, refundUserCredit } = require('../middleware/planGuard.middleware');
const logger = require('../config/logger');

/**
 * Create a new draft interview per PDF pp. 440-500
 * POST /api/interviews
 */
const createInterview = async (req, res, next) => {
  try {
    const jobTitle = req.body.jobTitle || req.body.role || req.body.targetRole || 'Full Stack Engineer';
    let jobDescription = req.body.jobDescription || req.body.description || '';
    if (!jobDescription || jobDescription.trim().length < 50) {
      jobDescription = `Professional technical and behavioral interview assessment for ${jobTitle}. Rigorously evaluating problem-solving, architectural design, coding efficiency, and STAR methodology leadership competencies.`;
    }
    const {
      experienceLevel = 'mid',
      numberOfQuestions = 10,
      questionTypes = ['technical', 'behavioral'],
      company = '',
      resumeId = null,
    } = req.body;

    // If resumeId is provided, verify it belongs to user
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resume) {
        return next(new AppError('Linked resume not found or does not belong to you', 400));
      }
    }

    const interview = await Interview.create({
      userId: req.user._id,
      jobTitle,
      jobDescription,
      experienceLevel,
      numberOfQuestions,
      questionTypes,
      company,
      resumeId: resumeId || null,
      status: 'draft',
      generationStatus: 'pending',
      questions: [],
    });

    res.status(201).json({
      success: true,
      interview,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger RAG question generation per PDF pp. 500-520
 * Enforces credit deduction and auto-refund on failure per Paid Plans Addendum
 * POST /api/interviews/:id/generate
 */
const generateInterviewQuestions = async (req, res, next) => {
  let creditDeducted = false;
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    // Deduct 1 credit before generation
    const remainingCredits = await deductUserCredit(req.user._id);
    creditDeducted = true;

    // Set generation status to generating
    interview.generationStatus = 'generating';
    await interview.save();

    try {
      let resumeText = '';
      if (interview.resumeId) {
        const resume = await Resume.findById(interview.resumeId);
        if (resume && resume.extractedText) {
          resumeText = resume.extractedText;
        }
      }

      // Step 1 to 5: RAG Context Retrieval with section boosting
      const { context } = await retrieveRAGContext({
        resumeText,
        jobDescription: interview.jobDescription,
        jobTitle: interview.jobTitle,
        experienceLevel: interview.experienceLevel,
      });

      // Step 6: Groq Question Generation with llama-3.3-70b-versatile
      const questions = await generateQuestions({
        context,
        jobTitle: interview.jobTitle,
        experienceLevel: interview.experienceLevel,
        numberOfQuestions: interview.numberOfQuestions,
        questionTypes: interview.questionTypes,
      });

      interview.questions = questions;
      interview.status = 'ready';
      interview.generationStatus = 'generated';
      interview.generationError = null;
      await interview.save();

      res.status(200).json({
        success: true,
        interview,
        questions: interview.questions,
        remainingCredits,
        data: {
          interview,
          questions: interview.questions,
          remainingCredits,
        },
      });
    } catch (genError) {
      logger.error(`Question generation pipeline failure: ${genError.message}`);
      
      // Auto-refund deducted credit on failure
      if (creditDeducted) {
        await refundUserCredit(req.user._id, genError.message);
      }

      interview.generationStatus = 'failed';
      interview.generationError = genError.message;
      await interview.save();

      return res.status(500).json({
        success: false,
        message: 'Question generation failed. Credit has been refunded to your account.',
        error: genError.message,
      });
    }
  } catch (error) {
    if (creditDeducted) {
      await refundUserCredit(req.user._id, error.message);
    }
    next(error);
  }
};

/**
 * Get single interview per PDF p. 500
 * GET /api/interviews/:id
 */
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('resumeId', 'fileName fileUrl parsedData');

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List candidate's interviews (paginated)
 * GET /api/interviews
 */
const getInterviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      Interview.find({ userId: req.user._id })
        .populate('resumeId', 'fileName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Interview.countDocuments({ userId: req.user._id }),
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
 * Delete interview and cascade-delete sessions per PDF p. 2420
 * DELETE /api/interviews/:id
 */
const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    // Cascade delete sessions
    await Session.deleteMany({ interviewId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Interview and associated sessions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterview,
  generateInterviewQuestions,
  getInterview,
  getInterviews,
  deleteInterview,
};
