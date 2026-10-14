const express = require('express');
const reportService = require('../services/report.service');

const router = express.Router();

/**
 * Public visitor tracking hit
 * POST /api/analytics/track-visit
 */
router.post('/track-visit', async (req, res) => {
  try {
    const { sessionId, path = '/', referrer } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?._id || null;

    const log = await reportService.trackVisitor({
      sessionId: sessionId || `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      ip,
      path,
      referrer,
      userAgent,
    });

    res.status(200).json({ success: true, logged: Boolean(log) });
  } catch (err) {
    res.status(200).json({ success: true, logged: false });
  }
});

module.exports = router;
