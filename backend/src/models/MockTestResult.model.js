const mongoose = require('mongoose');

const mockTestResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testType: {
      type: String,
      enum: ['role', 'skill'],
      required: true,
    },
    targetSubject: {
      type: String,
      required: true, // e.g. "Frontend React Engineer", "System Design", "Backend Node.js"
    },
    difficulty: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: {
      technicalAccuracy: { type: Number, default: 0 },
      architectureDepth: { type: Number, default: 0 },
      edgeCaseHandling: { type: Number, default: 0 },
      communicationClarity: { type: Number, default: 0 },
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    questionCount: { type: Number, default: 3 },
    timeTakenSeconds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// High-concurrency query optimization indexes
mockTestResultSchema.index({ userId: 1, createdAt: -1 });
mockTestResultSchema.index({ testType: 1, targetSubject: 1 });

const MockTestResult = mongoose.model('MockTestResult', mockTestResultSchema);

module.exports = MockTestResult;
