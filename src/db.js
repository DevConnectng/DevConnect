const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function openDb(filename, migrations) {
  const db = new sqlite3.Database(path.join(dataDir, filename));
  db.serialize(() => {
    migrations.forEach(sql => db.run(sql));
  });
  return db;
}

// Table creation SQL for each DB
const usersSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    skills TEXT,
    bio TEXT,
    verified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

const gigsSchema = `
  CREATE TABLE IF NOT EXISTS gigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    budget TEXT,
    skills_needed TEXT,
    type TEXT,
    location TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_gigs_user_id ON gigs(user_id);
  CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
`;

const commentsSchema = `
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gig_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_comments_gig_id ON comments(gig_id);
`;

const messagesSchema = `
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    gig_id INTEGER,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
  CREATE INDEX IF NOT EXISTS idx_messages_gig_id ON messages(gig_id);
`;

const notificationsSchema = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT,
    related_id INTEGER,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
`;

// Export database connections
module.exports = {
  users: openDb('users.db', [usersSchema]),
  gigs: openDb('gigs.db', [gigsSchema]),
  comments: openDb('comments.db', [commentsSchema]),
  messages: openDb('messages.db', [messagesSchema]),
  notifications: openDb('notifications.db', [notificationsSchema]),
  initialize: () => {
  }
};
