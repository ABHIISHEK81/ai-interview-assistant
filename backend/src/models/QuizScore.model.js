const mongoose = require('mongoose');

const quizScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: 'Anonymous Candidate',
    },
    category: {
      type: String,
      required: true, // e.g. "Full-Stack JavaScript", "System Architecture", "Python & AI"
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      default: 5,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 60,
    },
    streakMax: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// High-concurrency leaderboard and user ranking indexes
quizScoreSchema.index({ category: 1, score: -1 });
quizScoreSchema.index({ score: -1, createdAt: -1 });
quizScoreSchema.index({ userId: 1, createdAt: -1 });

const QuizScore = mongoose.model('QuizScore', quizScoreSchema);

module.exports = QuizScore;
