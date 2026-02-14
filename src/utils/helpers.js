const sqlite3 = require('sqlite3');
const { promisify } = require('util');

// Promisify sqlite3 methods for a given database instance
const promisifyDb = (db) => ({
  run: promisify(db.run.bind(db)),
  get: promisify(db.get.bind(db)),
  all: promisify(db.all.bind(db)),
  exec: promisify(db.exec.bind(db))
});

// Input sanitization (basic)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '');
};

// Validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate username (alphanumeric and underscores, 3-30 chars)
const isValidUsername = (username) => {
  const re = /^[a-zA-Z0-9_]{3,30}$/;
  return re.test(username);
};

// Pagination helper
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  promisifyDb,
  sanitizeString,
  isValidEmail,
  isValidUsername,
  getPaginationParams
};
