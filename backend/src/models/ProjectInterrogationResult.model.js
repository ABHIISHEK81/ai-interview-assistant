const mongoose = require('mongoose');

const projectInterrogationResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    projectTitle: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      default: 'Senior Software Engineer',
    },
    technologies: [
      {
        type: String,
      },
    ],
    practicalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    authenticityRating: {
      type: String,
      enum: ['Verified Hands-On Architect', 'Strong Practitioner', 'Intermediate Implementer', 'Theoretical / Surface Level'],
      default: 'Strong Practitioner',
    },
    rubricBreakdown: {
      technicalDepth: { type: Number, default: 75 },
      tradeOffAwareness: { type: Number, default: 70 },
      scalingAndConcurrency: { type: Number, default: 70 },
      incidentHandling: { type: Number, default: 75 },
    },
    strengths: [
      {
        type: String,
      },
    ],
    blindSpots: [
      {
        type: String,
      },
    ],
    interrogationQnA: [
      {
        questionId: String,
        questionText: String,
        questionType: String,
        candidateAnswer: String,
        score: Number,
        practicalCritique: String,
        idealArchitecturalApproach: String,
      },
    ],
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectInterrogationResult = mongoose.model(
  'ProjectInterrogationResult',
  projectInterrogationResultSchema
);

module.exports = ProjectInterrogationResult;
