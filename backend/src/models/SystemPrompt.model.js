const mongoose = require('mongoose');

const systemPromptSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'resume_parser',
        'ats_scorer',
        'feedback_report',
        'interview',
        'career_coach',
      ],
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [
      {
        content: { type: String, required: true },
        version: { type: Number, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SystemPrompt = mongoose.model('SystemPrompt', systemPromptSchema);

module.exports = SystemPrompt;
