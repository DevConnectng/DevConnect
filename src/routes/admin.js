const express = require('express');
const db = require('../db');
const { promisifyDb } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const usersDb = promisifyDb(db.users);
const gigsDb = promisifyDb(db.gigs);
const commentsDb = promisifyDb(db.comments);

// Get all users (with pagination) - already in users.js but admin only
// We'll add admin-specific actions

// Ban/unban user
router.put('/users/:id/ban', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { ban } = req.body; // true = ban, false = unban
    if (ban === undefined) return res.status(400).json({ error: 'Ban status required' });

    const user = await usersDb.get('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin' });

    const newRole = ban ? 'banned' : 'user';
    await usersDb.run('UPDATE users SET role = ? WHERE id = ?', [newRole, req.params.id]);
    res.json({ message: `User ${ban ? 'banned' : 'unbanned'}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Verify user
router.put('/users/:id/verify', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await usersDb.run('UPDATE users SET verified = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'User verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Delete gig
router.delete('/gigs/:id', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await gigsDb.run('DELETE FROM gigs WHERE id = ?', [req.params.id]);
    // Also delete related comments
    await commentsDb.run('DELETE FROM comments WHERE gig_id = ?', [req.params.id]);
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gig' });
  }
});

// Delete comment
router.delete('/comments/:id', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await commentsDb.run('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
