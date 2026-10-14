/**
 * Input Sanitization Middleware
 * Defends against NoSQL query operator injection and Cross-Site Scripting (XSS).
 */

// Characters/patterns to neutralize for NoSQL injection
function sanitizeNoSQL(target) {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeNoSQL);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(target)) {
    // Prohibit MongoDB operators like $gt, $ne, $where, $regex, etc.
    // Also prohibit dot notation keys that attempt nested object manipulation
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Discard operator key
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map(sanitizeNoSQL);
      } else {
        const child = sanitizeNoSQL(value);
        if (Object.keys(child).length > 0) {
          cleaned[key] = child;
        }
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

// Strip malicious scripts and event handlers from strings
function sanitizeXSSString(str) {
  if (typeof str !== 'string') return str;

  return str
    // Strip <script> tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip javascript: pseudo-protocol
    .replace(/javascript:[^"'\s]*/gi, '')
    // Strip malicious inline DOM event handlers (e.g. onerror=, onload=, onclick=)
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function sanitizeXSS(target) {
  if (target === null || target === undefined) return target;

  if (typeof target === 'string') {
    return sanitizeXSSString(target);
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeXSS);
  }

  if (typeof target === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(target)) {
      cleaned[key] = sanitizeXSS(value);
    }
    return cleaned;
  }

  return target;
}

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeXSS(sanitizeNoSQL(req.body));
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeXSS(sanitizeNoSQL(req.query));
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeXSS(sanitizeNoSQL(req.params));
  }

  next();
};

module.exports = {
  sanitizeInput,
  sanitizeNoSQL,
  sanitizeXSS,
};
