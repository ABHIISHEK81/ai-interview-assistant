/**
 * cache.service.js
 * High-performance, zero-friction in-memory TTL caching engine.
 * Eliminates database round-trips for high-read, concurrent endpoints.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    // Periodically sweep expired items every 60 seconds
    this.sweepInterval = setInterval(() => this.sweep(), 60000);
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref(); // Don't hold Node process open
    }
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    return value;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  del(key) {
    return this.store.delete(key);
  }

  flushPattern(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear() {
    this.store.clear();
  }

  sweep() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      activeKeys: Array.from(this.store.keys()),
    };
  }
}

const cache = new MemoryCache();

/**
 * Express Middleware for caching GET requests
 * @param {number} ttlSeconds 
 */
const cacheMiddleware = (ttlSeconds = 30) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `http:${req.originalUrl || req.url}`;
    const cachedBody = cache.get(cacheKey);

    if (cachedBody) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(cachedBody);
    }

    res.setHeader('X-Cache-Status', 'MISS');

    // Intercept res.json to populate cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = {
  cache,
  cacheMiddleware,
};
