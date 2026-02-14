const express = require('express');
const db = require('../db');
const { promisifyDb, sanitizeString } = require('../utils/helpers');
const { verifyCsrfToken, generateCsrfToken } = require('../middleware/auth');

const router = express.Router();
const commentsDb = promisifyDb(db.comments);
const gigsDb = promisifyDb(db.gigs);
const notificationsDb = promisifyDb(db.notifications);

// Post a comment on a gig
router.post('/', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const { gig_id, text, parent_id } = req.body;
    if (!gig_id || !text) {
      return res.status(400).json({ error: 'Gig ID and text required' });
    }

    const cleanText = sanitizeString(text);

    // Check if gig exists
    const gig = await gigsDb.get('SELECT user_id FROM gigs WHERE id = ?', [gig_id]);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const result = await commentsDb.run(
      'INSERT INTO comments (gig_id, user_id, text, parent_id) VALUES (?, ?, ?, ?)',
      [gig_id, req.user.id, cleanText, parent_id || null]
    );

    // Notify gig owner if commenter is not the owner
    if (gig.user_id !== req.user.id) {
      await notificationsDb.run(
        'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
        [gig.user_id, 'comment', gig_id, `${req.user.username} commented on your gig`]
      );
    }

    // If it's a reply, notify parent comment author (if not same)
    if (parent_id) {
      const parent = await commentsDb.get('SELECT user_id FROM comments WHERE id = ?', [parent_id]);
      if (parent && parent.user_id !== req.user.id && parent.user_id !== gig.user_id) {
        await notificationsDb.run(
          'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
          [parent.user_id, 'reply', gig_id, `${req.user.username} replied to your comment`]
        );
      }
    }

    res.status(201).json({ id: result.lastID, message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a comment (admin or own)
router.delete('/:id', generateCsrfToken, verifyCsrfToken, async (req, res) => {
  try {
    const comment = await commentsDb.get('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await commentsDb.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [req.params.id, req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
