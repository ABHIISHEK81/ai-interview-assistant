const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

if (isRedisEnabled) {
  try {
    const redisOptions = {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection retry limit reached. Continuing without cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    };

    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, redisOptions);
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        ...redisOptions,
      });
    }

    redisClient.on('connect', () => {
      logger.info('Redis client connected.');
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection error: ${err.message}. Cache degraded silently.`);
    });
  } catch (err) {
    logger.warn(`Failed to instantiate Redis client: ${err.message}`);
    redisClient = null;
  }
} else {
  logger.info('Redis is disabled via REDIS_ENABLED=false. Cache will be bypassed.');
}

module.exports = redisClient;
