const express = require('express');
const db = require('../db');
const { promisifyDb, sanitizeString, getPaginationParams } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const gigsDb = promisifyDb(db.gigs);
const commentsDb = promisifyDb(db.comments);
const notificationsDb = promisifyDb(db.notifications);

// Create a new gig
router.post('/', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { title, description, budget, skills_needed, type, location, deadline } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const cleanTitle = sanitizeString(title);
    const cleanDesc = sanitizeString(description || '');
    const cleanBudget = sanitizeString(budget || '');
    const cleanSkills = sanitizeString(skills_needed || '');
    const cleanType = sanitizeString(type || '');
    const cleanLocation = sanitizeString(location || '');
    const cleanDeadline = sanitizeString(deadline || '');

    const result = await gigsDb.run(
      `INSERT INTO gigs (user_id, title, description, budget, skills_needed, type, location, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, cleanTitle, cleanDesc, cleanBudget, cleanSkills, cleanType, cleanLocation, cleanDeadline]
    );

    res.status(201).json({ id: result.lastID, message: 'Gig created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create gig' });
  }
});

// Get all gigs (feed) with pagination and optional filters
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { type, status, search } = req.query;
    let query = 'SELECT * FROM gigs WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR skills_needed LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const gigs = await gigsDb.all(query, params);
    const total = await gigsDb.get('SELECT COUNT(*) as count FROM gigs');
    res.json({ gigs, total: total.count, page: parseInt(req.query.page) || 1, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
});

// Get a single gig with comments
router.get('/:id', async (req, res) => {
  try {
    const gig = await gigsDb.get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const comments = await commentsDb.all(
      'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.gig_id = ? ORDER BY c.created_at',
      [req.params.id]
    );

    res.json({ gig, comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gig' });
  }
});

// Update gig status (e.g., close)
router.put('/:id/status', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'in-progress'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const gig = await gigsDb.get('SELECT user_id FROM gigs WHERE id = ?', [req.params.id]);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await gigsDb.run('UPDATE gigs SET status = ? WHERE id = ?', [status, req.params.id]);

    // Create notification for gig owner if status changed by admin or other
    if (gig.user_id !== req.user.id) {
      await notificationsDb.run(
        'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
        [gig.user_id, 'gig_status', parseInt(req.params.id), `Your gig status changed to ${status}`]
      );
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
