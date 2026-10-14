const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');
const logger = require('./config/logger');

// Validate and set port
const PORT = parseInt(process.env.PORT || '5000', 10);

const httpServer = http.createServer(app);

// Attach Socket.io directly to HTTP server per PDF p. 10
initSocket(httpServer);

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Auto-seed default plans per Paid Plans Addendum
    const Plan = require('./models/Plan.model');
    await Plan.seedDefaultPlans();
    logger.info('Auto-seeded default subscription plans (Free, Basic, Medium, Advanced).');

    // Auto-seed initial system administrator if configured
    const User = require('./models/User.model');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@interviewai.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'super_admin',
        isActive: true,
        isBanned: false,
      });
      logger.info(`Auto-seeded initial system administrator (${adminEmail}).`);
    }

    const candidateExists = await User.findOne({ email: 'candidate@interviewai.com' });
    if (!candidateExists) {
      await User.create({
        name: 'Demo Candidate',
        email: 'candidate@interviewai.com',
        password: 'Password123!',
        role: 'candidate',
        credits: 2,
        isActive: true,
        isBanned: false,
      });
      logger.info('Auto-seeded default candidate (candidate@interviewai.com).');
    }

    const abhishekExists = await User.findOne({ email: 'abhishek@example.com' });
    if (!abhishekExists) {
      await User.create({
        name: 'Abhishek Sharma',
        email: 'abhishek@example.com',
        password: 'Password123!',
        role: 'candidate',
        credits: 2,
        isActive: true,
        isBanned: false,
      });
      logger.info('Auto-seeded standard user Abhishek (abhishek@example.com).');
    }

    // Start background schedulers per PDF & Addendum
    const { initPlanRenewalScheduler } = require('./schedulers/planRenewalScheduler');
    initPlanRenewalScheduler();
    const { initMonthlyReportScheduler } = require('./schedulers/monthlyReportScheduler');
    initMonthlyReportScheduler();

    httpServer.listen(PORT, () => {
      logger.info(`=================================================`);
      logger.info(`  interviewAI Backend API Server Running`);
      logger.info(`  URL:          http://localhost:${PORT}`);
      logger.info(`  Health Probe: http://localhost:${PORT}/api/health`);
      logger.info(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Embeddings:   ${process.env.EMBEDDING_PROVIDER || 'local'}`);
      logger.info(`=================================================`);
    });
  } catch (error) {
    logger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Process terminated.');
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[Process Resiliency] Unhandled Promise Rejection: ${reason?.message || reason}`, {
    stack: reason?.stack || 'No stack',
  });
  // Do not crash the process; keep concurrent candidate sessions active
});

process.on('uncaughtException', (err) => {
  logger.error(`[Process Resiliency] Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Only terminate in production if process state is corrupted; allow in-flight connections to drain
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }
});

startServer();

module.exports = { app, httpServer };
