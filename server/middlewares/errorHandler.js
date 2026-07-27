/**
 * Global Error Handler Middleware
 * Positioned as the last middleware to catch and return formatted JSON error responses.
 */
module.exports = function errorHandler(err, req, res, next) {
  console.error('Global Error Handler caught:', err)
  
  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message: message
    }
  })
}
