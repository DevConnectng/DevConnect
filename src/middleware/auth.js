const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { promisify } = require('util');

const dbGet = promisify(db.users.get.bind(db.users));

// Generate CSRF token and set cookie
const generateCsrfToken = (req, res, next) => {
  if (req.method === 'GET') return next();
  const token = require('crypto').randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, { httpOnly: false, secure: config.nodeEnv === 'production', sameSite: 'strict' });
  req.csrfToken = token;
  next();
};

// Verify CSRF token from header or body
const verifyCsrfToken = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const cookieToken = req.cookies.csrfToken;
  if (!token || token !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
};

// Verify JWT from httpOnly cookie
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await dbGet('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.role === 'banned') {
      return res.status(403).json({ error: 'Account banned' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  generateCsrfToken,
  verifyCsrfToken,
  verifyToken,
  requireAdmin
};
