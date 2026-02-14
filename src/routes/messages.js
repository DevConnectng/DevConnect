const express = require('express');
const db = require('../db');
const { promisifyDb, sanitizeString, getPaginationParams } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const messagesDb = promisifyDb(db.messages);
const notificationsDb = promisifyDb(db.notifications);

// Send a message
router.post('/', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { receiver_id, gig_id, text } = req.body;
    if (!receiver_id || !text) {
      return res.status(400).json({ error: 'Receiver and text required' });
    }

    const cleanText = sanitizeString(text);

    const result = await messagesDb.run(
      'INSERT INTO messages (sender_id, receiver_id, gig_id, text) VALUES (?, ?, ?, ?)',
      [req.user.id, receiver_id, gig_id || null, cleanText]
    );

    // Create notification for receiver
    await notificationsDb.run(
      'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
      [receiver_id, 'message', result.lastID, `${req.user.username} sent you a message`]
    );

    res.status(201).json({ id: result.lastID, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between current user and another user (for a gig)
router.get('/conversation/:userId', async (req, res) => {
  try {
    const otherId = parseInt(req.params.userId);
    const { gig_id } = req.query; // optional gig filter

    let query = `
      SELECT m.*, sender.username as sender_name, receiver.username as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    `;
    const params = [req.user.id, otherId, otherId, req.user.id];

    if (gig_id) {
      query += ' AND m.gig_id = ?';
      params.push(gig_id);
    }

    query += ' ORDER BY m.created_at ASC';

    const messages = await messagesDb.all(query, params);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get all conversations for current user (list of users they've chatted with)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await messagesDb.all(`
      SELECT DISTINCT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as user_id,
        u.username,
        (SELECT text FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_time,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = u.id AND read = 0) as unread
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = ? OR m.receiver_id = ?
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read (for a specific sender in a conversation)
router.put('/read/:userId', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    await messagesDb.run(
      'UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ? AND read = 0',
      [req.user.id, req.params.userId]
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

module.exports = router;
