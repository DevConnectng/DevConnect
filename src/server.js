const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/error');
const db = require('./db'); // custom module to open all databases

const app = express();

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'));
}

// Initialize databases and tables
db.initialize();

// Auto-seed admin if none exists
(async () => {
  const adminExists = await db.users.get(
    'SELECT id FROM users WHERE role = ?',
    ['admin']
  );
  if (!adminExists) {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(config.adminPassword, 10);
    await db.users.run(
      'INSERT INTO users (username, email, password_hash, role, verified) VALUES (?, ?, ?, ?, ?)',
      [config.adminUsername, config.adminEmail, hash, 'admin', 1]
    );
    console.log('Admin account seeded');
  }
})();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // for Tailwind CDN
}));
app.use(cors({
  origin: config.nodeEnv === 'production' ? config.frontendUrl : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF token generation for all non-GET, non-API routes? We'll handle via middleware on specific routes.

// Static files (public)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware.verifyToken, require('./routes/users'));
app.use('/api/gigs', authMiddleware.verifyToken, require('./routes/gigs'));
app.use('/api/comments', authMiddleware.verifyToken, require('./routes/comments'));
app.use('/api/messages', authMiddleware.verifyToken, require('./routes/messages'));
app.use('/api/notifications', authMiddleware.verifyToken, require('./routes/notifications'));
app.use('/api/admin', authMiddleware.verifyToken, authMiddleware.requireAdmin, require('./routes/admin'));

// Serve HTML pages without .html extension
app.get(/^\/(?!api).*$/, (req, res, next) => {
  const filePath = path.join(__dirname, '..', 'public', req.path + '.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Try index.html if root
    if (req.path === '/') {
      return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
    // 404 page
    res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
  }
});

// Error handling
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`DevConnect running on port ${PORT}`);
});
