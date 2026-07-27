const express = require('express')
const cors = require('cors')
const logger = require('./middlewares/logger')
const errorHandler = require('./middlewares/errorHandler')
const taskRoutes = require('./routes/taskRoutes')

const app = express()
const PORT = process.env.PORT || 5000

// 1. CORS configuration to allow cross-origin requests
app.use(cors())

// 2. Global Request Logger middleware
app.use(logger)

// 3. Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 4. API Routes
app.use('/tasks', taskRoutes)

// 5. Test Error Route (specifically to trigger error middleware)
app.get('/trigger-error', (req, res, next) => {
  const error = new Error('This is a simulated internal server error for testing.')
  error.status = 500
  next(error)
})

// 6. Root status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Express CRUD server is running.' })
})

// 7. Global Error Handler middleware (MUST be the last middleware)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`)
    console.error(`On macOS, this is usually occupied by the "AirPlay Receiver" service.`)
    console.error(`To fix this and run the server on port ${PORT}:`)
    console.error(`1. Open "System Settings"`)
    console.error(`2. Go to "General" -> "AirDrop & Handoff"`)
    console.error(`3. Toggle "AirPlay Receiver" OFF.`)
    console.error(`Alternatively, you can run the server on a different port by setting the PORT environment variable: PORT=5001 npm start\n`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
  }
})
