// lib/security.js - Security utilities: rate limiting, validation, sanitization

// SECURITY (P1 #5): Simple in-memory rate limiter (per serverless instance)
const rateLimitStore = new Map();

function rateLimit(req, res, { key, maxAttempts = 5, windowMs = 15 * 60 * 1000 }) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const identifier = `${key}:${ip}`;
  const now = Date.now();

  const record = rateLimitStore.get(identifier);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  record.count += 1;
  if (record.count > maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    return false;
  }
  return true;
}

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(key);
  }
}, 60 * 1000).unref?.();

// SECURITY (P3 #14): Email format validation
function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// SECURITY (P2 #11): Escape HTML output
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SECURITY (P2 #11): Escape for use inside HTML attribute values
function escapeAttr(str) {
  return escapeHtml(str);
}

// Validate integer within range
function isValidInt(value, min, max) {
  const num = parseInt(value, 10);
  return Number.isInteger(num) && num >= min && num <= max;
}

// Validate number within range
function isValidNumber(value, min, max) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

// SECURITY (P1 #7): File upload validation
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFileUpload(contentType, size) {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { valid: false, error: 'Only PDF, JPG, and PNG files are allowed' };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  return { valid: true };
}

// SECURITY (P2 #20): Security headers for HTML responses
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

module.exports = {
  rateLimit,
  isValidEmail,
  escapeHtml,
  escapeAttr,
  isValidInt,
  isValidNumber,
  validateFileUpload,
  setSecurityHeaders,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};