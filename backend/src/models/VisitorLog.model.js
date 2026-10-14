const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
    path: {
      type: String,
      default: '/',
    },
    referrer: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    hasCompletedAction: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionCompleted: {
      type: String,
      enum: [
        'session_completed',
        'mock_test_taken',
        'quiz_completed',
        'ats_analyzed',
        'interview_created',
        'registered',
        null,
      ],
      default: null,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

module.exports = VisitorLog;
