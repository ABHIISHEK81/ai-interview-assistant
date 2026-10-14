const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileFormat: {
      type: String,
      enum: ['xlsx', 'csv'],
      default: 'xlsx',
    },
    metrics: {
      mau: { type: Number, default: 0 },
      totalVisitors: { type: Number, default: 0 },
      droppedOffUsers: { type: Number, default: 0 },
      dropOffRate: { type: Number, default: 0 }, // percentage
      totalRegistrations: { type: Number, default: 0 },
      totalInterviews: { type: Number, default: 0 },
      completedSessions: { type: Number, default: 0 },
      atsAnalyses: { type: Number, default: 0 },
      quizAttempts: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }, // in INR
      averageScore: { type: Number, default: 0 },
    },
    excelBufferBase64: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['generated', 'compiled', 'archived'],
      default: 'generated',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

monthlyReportSchema.index({ year: 1, month: 1 }, { unique: true });

const MonthlyReport = mongoose.model('MonthlyReport', monthlyReportSchema);

module.exports = MonthlyReport;
