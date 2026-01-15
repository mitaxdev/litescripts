// src/middleware/errorHandler.js
// A basic error-handling middleware for Express

export default function errorHandler(err, req, res, next) {
  console.error('Error:', err.stack || err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
