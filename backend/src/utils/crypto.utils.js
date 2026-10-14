const crypto = require('crypto');
const path = require('path');

// Derive 32-byte AES-256 key from environment secret
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'interviewai_production_encryption_secret_key_32bytes!!';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt plaintext using authenticated AES-256-GCM
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted string format: iv:authTag:ciphertext (hex)
 */
function encryptData(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

/**
 * Decrypt ciphertext using authenticated AES-256-GCM
 * @param {string} encryptedString - String format: iv:authTag:ciphertext (hex)
 * @returns {string} Original plaintext
 */
function decryptData(encryptedString) {
  if (!encryptedString || typeof encryptedString !== 'string') return encryptedString;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    // If not in encrypted format, return as-is
    return encryptedString;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    throw new Error(`Decryption failed or data tampered: ${err.message}`);
  }
}

/**
 * Hash sensitive token (e.g. password reset token) with SHA-256
 * @param {string} token 
 * @returns {string} SHA-256 hex digest
 */
function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sanitize filename to prevent directory traversal
 * @param {string} filename 
 * @returns {string} Safe filename
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed_file';
  // Strip null bytes and path separators
  return filename
    .replace(/\0/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '')
    .trim();
}

/**
 * Validate that target file path is safely confined within expected base directory
 * @param {string} baseDir 
 * @param {string} targetPath 
 * @returns {boolean}
 */
function isSafePath(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedBase);
}

module.exports = {
  encryptData,
  decryptData,
  hashToken,
  sanitizeFilename,
  isSafePath,
};
