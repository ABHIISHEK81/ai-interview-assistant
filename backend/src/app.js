const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/sanitize.middleware');
const AppError = require('./utils/AppError');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const resumeRoutes = require('./routes/resume.routes');
const interviewRoutes = require('./routes/interview.routes');
const sessionRoutes = require('./routes/session.routes');
const adminRoutes = require('./routes/admin.routes');
const billingRoutes = require('./routes/billing.routes');
const mockTestRoutes = require('./routes/mockTest.routes');
const quizRoutes = require('./routes/quiz.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// Trust reverse proxies (Cloudflare, AWS ALB, Nginx, Render) for accurate client IP resolution
app.set('trust proxy', 1);

// HTTPS Enforcement in Production
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }
  next();
});

// Request timeout middleware (30 seconds) to prevent hung sockets from exhausting server resources
app.use((req, res, next) => {
  // Exclude long-running streaming endpoints if any
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timed out. Please try again.',
      });
    }
  }, 30000);

  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));
  next();
});

// CORS configuration matching CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Enhanced Helmet Security Headers per Industry Standards (OWASP Top 10)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", clientUrl, 'http://localhost:5000', 'ws:', 'wss:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Required for WebRTC camera/audio proctor feeds
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' }, // Anti-clickjacking protection
    noSniff: true, // Anti-MIME sniffing protection
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Gzip compression for high-speed network transmission
app.use(compression());

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization against NoSQL query operator injection & XSS
app.use(sanitizeInput);

// Per-request structured logging
app.use(requestLogger);

// --- Tiered Rate Limiting for High Concurrency & Brute-Force Defense ---
// 1. Health endpoint is mounted BEFORE rate limiting so uptime checkers never get 429
app.use('/api', healthRoutes);

// 2. Strict Auth Limiter for login & registration to prevent credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 3. Dedicated Resume Limiter to protect parser and OCR compute
const resumeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Resume parsing limit reached for this IP. Please wait a few moments.',
  },
});
app.use('/api/resumes/upload', resumeLimiter);
app.use('/api/resumes/ats-score', resumeLimiter);
app.use('/api/resumes/analyze', resumeLimiter);

// 4. Dedicated Billing Limiter to prevent checkout session flooding
const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many billing requests. Please wait a moment before trying again.',
  },
});
app.use('/api/billing/checkout', billingLimiter);

// 5. High-capacity General API Limiter for candidate traffic (2,500 requests per 15 min per IP)
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '2500', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'High traffic limit reached for this IP. Please wait a moment and try again.',
  },
});
app.use('/api/', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    name: 'interviewAI API',
    status: 'online',
    health: '/api/health',
    docs: 'Available in PDF documentation',
  });
});

// Handle unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
