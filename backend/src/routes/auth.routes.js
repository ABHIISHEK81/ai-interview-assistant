const express = require('express');
const {
  register,
  login,
  oauthAuth,
  getOAuthRedirect,
  refreshToken,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
} = require('../middleware/validation');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/oauth', oauthAuth);
router.get('/oauth/:provider', getOAuthRedirect);
router.get('/:provider(google|linkedin|github)', getOAuthRedirect);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
