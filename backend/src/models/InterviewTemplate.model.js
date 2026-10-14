const mongoose = require('mongoose');

const interviewTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    evaluationPrompt: {
      type: String,
      required: true,
    },
    feedbackPrompt: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    duration: {
      type: Number,
      min: [5, 'Duration must be at least 5 minutes'],
      default: 30,
    },
    questionCount: {
      type: Number,
      min: [1, 'Question count must be at least 1'],
      default: 5,
    },
    voiceId: {
      type: String,
      enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      default: 'alloy',
    },
    voiceSpeed: {
      type: Number,
      min: 0.5,
      max: 2.0,
      default: 1.0,
    },
    voicePitch: {
      type: Number,
      min: 0.5,
      max: 2.0,
      default: 1.0,
    },
    language: {
      type: String,
      default: 'en',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const InterviewTemplate = mongoose.model('InterviewTemplate', interviewTemplateSchema);

module.exports = InterviewTemplate;
