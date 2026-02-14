// 404 handler for unmatched routes
const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = {
  notFound,
  errorHandler
};
