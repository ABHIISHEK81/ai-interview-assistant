const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { cache } = require('../services/cache.service');

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    service: 'interviewAI-api',
    database: dbStatus,
    embeddingProvider: process.env.EMBEDDING_PROVIDER || 'local',
    systemMetrics: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      cacheEntries: cache.getStats().size,
    },
  });
});

module.exports = router;
