const express = require('express');
const db = require('../db');
const { promisifyDb } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const notificationsDb = promisifyDb(db.notifications);

// Get unread notifications for current user
router.get('/unread', async (req, res) => {
  try {
    const notifications = await notificationsDb.all(
      'SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get all notifications with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const notifications = await notificationsDb.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );
    const total = await notificationsDb.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [req.user.id]);
    res.json({ notifications, total: total.count, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.put('/:id/read', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await notificationsDb.run(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await notificationsDb.run(
      'UPDATE notifications SET read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
