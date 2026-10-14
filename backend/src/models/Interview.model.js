const mongoose = require('mongoose');

const questionSubSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'hr', 'culture_fit', 'coding'],
      default: 'technical',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    expectedKeywords: [
      {
        type: String,
      },
    ],
    sampleAnswer: {
      type: String,
    },
    starterCode: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: true,
  }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Please provide the job title'],
      trim: true,
    },
    jobDescription: {
      type: String,
      required: [true, 'Please provide the job description'],
      minlength: [50, 'Job description must be at least 50 characters long'],
      maxlength: [5000, 'Job description cannot exceed 5000 characters'],
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid',
    },
    numberOfQuestions: {
      type: Number,
      min: [3, 'Minimum questions is 3'],
      max: [20, 'Maximum questions is 20'],
      default: 10,
    },
    questionTypes: {
      type: [String],
      enum: ['technical', 'behavioral', 'situational', 'hr', 'culture_fit', 'coding'],
      default: ['technical', 'behavioral'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'in_progress', 'completed'],
      default: 'draft',
    },
    generationStatus: {
      type: String,
      enum: ['pending', 'generating', 'generated', 'failed'],
      default: 'pending',
    },
    generationError: {
      type: String,
      default: null,
    },
    questions: [questionSubSchema],
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
