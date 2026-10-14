const express = require('express');
const {
  startSession,
  submitAnswer,
  completeSession,
  getSession,
  getSessions,
} = require('../controllers/session.controller');
const { protect } = require('../middleware/auth.middleware');
const { submitAnswerValidation } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // All session routes are protected

router.post('/start', startSession);
router.post('/', startSession);
router.post('/:id/answer', submitAnswerValidation, submitAnswer);
router.post('/:id/answers', submitAnswerValidation, submitAnswer);
router.post('/:id/complete', completeSession);
router.get('/:id', getSession);
router.get('/', getSessions);

module.exports = router;
