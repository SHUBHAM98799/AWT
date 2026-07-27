/**
 * Global Request Logger Middleware
 * Logs HTTP Method, Request URL, and Timestamp for every incoming request.
 */
module.exports = function logger(req, res, next) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`)
  next()
}
