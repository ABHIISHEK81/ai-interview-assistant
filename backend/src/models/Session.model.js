const mongoose = require('mongoose');

const answerSubSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionText: {
      type: String,
      default: '',
    },
    answerText: {
      type: String,
      default: '',
    },
    timeTaken: {
      type: Number,
      default: 0, // In seconds
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    aiFeedback: {
      type: String,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'abandoned'],
      default: 'started',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalTimeTaken: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    strengths: {
      type: [String],
      default: [],
    },
    areasForImprovement: {
      type: [String],
      default: [],
    },
    recommendedResources: {
      type: [String],
      default: [],
    },
    answers: [answerSubSchema],
  },
  {
    timestamps: true,
  }
);

// High-concurrency query optimization indexes
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ status: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1 });

// Fallback method to calculate overall score if AI call fails per PDF p. 876
sessionSchema.methods.calculateOverallScore = function () {
  if (!this.answers || this.answers.length === 0) return 0;
  let totalScore = 0;
  let evaluatedCount = 0;
  for (const ans of this.answers) {
    if (ans.skipped) {
      totalScore += 0;
      evaluatedCount++;
    } else if (ans.aiScore !== null && ans.aiScore !== undefined) {
      totalScore += ans.aiScore;
      evaluatedCount++;
    }
  }
  if (evaluatedCount === 0) return 0;
  // Scale average from 1-10 to 1-100
  return Math.round((totalScore / evaluatedCount) * 10);
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
