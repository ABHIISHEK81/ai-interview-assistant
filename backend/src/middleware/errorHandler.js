const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  if (err.statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${err.message}`, { stack: err.stack, path: req.originalUrl });
  } else {
    logger.warn(`[Client Error ${err.statusCode}] ${err.message}`, { path: req.originalUrl });
  }

  // Handle common Mongoose / JWT errors cleanly
  let message = err.message;
  let statusCode = err.statusCode;

  if (err.name === 'CastError') {
    message = `Resource not found with id ${err.value}`;
    statusCode = 404;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered for ${field}. Please use another value.`;
    statusCode = 400;
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    message = `Invalid input: ${errors.join('. ')}`;
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    status: err.status,
    message,
    errorCode: err.errorCode || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
