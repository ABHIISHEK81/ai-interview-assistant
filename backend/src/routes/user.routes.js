const express = require('express');
const {
  updateProfile,
  changePassword,
  getUserStats,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All user routes are protected

router.patch('/profile', updateProfile);
router.put('/profile', updateProfile);
router.patch('/change-password', changePassword);
router.get('/stats', getUserStats);

module.exports = router;
