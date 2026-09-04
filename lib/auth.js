// lib/auth.js - Authentication helpers
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('./db');

// SECURITY (P0 #2): Fail fast if JWT_SECRET is not configured
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required but not set.');
}
const JWT_EXPIRES_IN = '7d';

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=')[1].trim());
    }
  }
  return null;
}

async function getCurrentUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const connection = await getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id, email, role, student_id FROM users WHERE id = ?',
      [decoded.id]
    );
    return users.length > 0 ? users[0] : null;
  } finally {
    await connection.end();
  }
}

function requireAuth(req, res) {
  return new Promise(async (resolve, reject) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return reject();
    }
    resolve(user);
  });
}

function requireAdmin(req, res) {
  return new Promise(async (resolve, reject) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return reject();
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return reject();
    }
    resolve(user);
  });
}

// SECURITY (P2 #9): Centralized secure cookie helper
function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const flags = `HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', `token=${encodeURIComponent(token)}; ${flags}`);
}

function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const flags = `HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', `token=; ${flags}`);
}

// SECURITY (P2 #10): CSRF protection via Origin header verification
function verifyOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true; // Non-browser clients (curl, mobile apps)
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);
  if (allowedOrigins.length === 0) return true; // No origin configured; allow (Vercel sets VERCEL_URL automatically)
  if (allowedOrigins.includes(origin)) return true;
  res.status(403).json({ error: 'Forbidden origin' });
  return false;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  setAuthCookie,
  clearAuthCookie,
  verifyOrigin,
};