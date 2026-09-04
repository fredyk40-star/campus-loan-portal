// lib/auth.js - Authentication helpers
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Check cookies
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
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

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  getCurrentUser,
  requireAuth,
  requireAdmin,
};