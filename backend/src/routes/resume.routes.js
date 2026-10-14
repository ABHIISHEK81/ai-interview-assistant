const express = require('express');
const {
  uploadResume,
  getResumes,
  getResume,
  setDefaultResume,
  deleteResume,
  reparseResume,
  getResumeChunks,
  analyzeResume,
  getATSScoreAndEditSuggestions,
  downloadResumeFile,
} = require('../controllers/resume.controller');
const {
  generateResumeCustomQuestions,
  extractResumeProjects,
  startProjectInterrogation,
  evaluateProjectInterrogation,
  getProjectInterrogationHistory,
} = require('../controllers/projectInterrogation.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // All resume routes are protected

// Core resume uploads and management
router.post('/', upload.single('resume'), uploadResume);
router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/:id', getResume);
router.get('/:id/file', downloadResumeFile);
router.get('/:id/download', downloadResumeFile);
router.patch('/:id/default', setDefaultResume);
router.put('/:id/default', setDefaultResume);
router.delete('/:id', deleteResume);
router.post('/:id/parse', reparseResume);
router.get('/:id/chunks', getResumeChunks);

// AI Resume Analyzer & ATS Scorer (Part 3 & Part 4)
router.post('/analyze', analyzeResume);
router.post('/ats-score', getATSScoreAndEditSuggestions);

// Resume-Based AI Questioning & Project Interrogation (Part 4)
router.post('/custom-questions', generateResumeCustomQuestions);
router.post('/extract-projects', extractResumeProjects);
router.post('/project-interrogation/start', startProjectInterrogation);
router.post('/project-interrogation/evaluate', evaluateProjectInterrogation);
router.get('/project-interrogation/history', getProjectInterrogationHistory);

module.exports = router;
