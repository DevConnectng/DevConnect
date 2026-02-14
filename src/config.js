require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminUsername: process.env.ADMIN_USERNAME || 'Voltage',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@localhost',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
