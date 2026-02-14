const express = require('express');
const db = require('../db');
const { promisifyDb, sanitizeString, getPaginationParams } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const usersDb = promisifyDb(db.users);

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await usersDb.get(
      'SELECT id, username, skills, bio, verified, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update own profile
router.put('/profile', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { skills, bio } = req.body;
    const cleanSkills = sanitizeString(skills);
    const cleanBio = sanitizeString(bio);

    await usersDb.run(
      'UPDATE users SET skills = ?, bio = ? WHERE id = ?',
      [cleanSkills, cleanBio, req.user.id]
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// List users (admin only)
router.get('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const { limit, offset } = getPaginationParams(req);
    const users = await usersDb.all(
      'SELECT id, username, email, role, verified, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const total = await usersDb.get('SELECT COUNT(*) as count FROM users');
    res.json({ users, total: total.count, page: parseInt(req.query.page) || 1, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
