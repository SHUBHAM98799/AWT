const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const app = express()
const PORT = process.env.PORT || 5000

// Simple dependency-free helper to load .env if it exists
const dotenvPath = path.join(__dirname, '.env')
if (fs.existsSync(dotenvPath)) {
  try {
    const envContent = fs.readFileSync(dotenvPath, 'utf8')
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=')
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim()
          const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '')
          if (key) {
            process.env[key] = value
          }
        }
      }
    })
  } catch (err) {
    console.error('Failed to read .env file:', err.message)
  }
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todoDB'

// Connect to MongoDB when the server starts
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB successfully at: ${MONGO_URI}`)
  })
  .catch((err) => {
    console.error(`❌ MongoDB connection error: Could not connect to database at ${MONGO_URI}`)
    console.error(err.message || err)
  })

// ─── MONGOOSE SCHEMAS & MODELS ───

// Task Model
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})
const Task = mongoose.model('Task', taskSchema, 'tasks')

// RequestLog Model
const requestLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  }
})
const RequestLog = mongoose.model('RequestLog', requestLogSchema, 'requestLogs')

// Setup request logging to logs/requests.log.csv
const logsDir = path.join(__dirname, 'logs')
const logFilePath = path.join(logsDir, 'requests.log.csv')

// Ensure logs directory and file exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, 'Timestamp,Method,URL,IP,StatusCode\n')
}

// ─── MIDDLEWARE 1: Global Request Logger (saves to MongoDB & CSV) ───
app.use((req, res, next) => {
  const timestamp = new Date()
  const method = req.method
  const url = req.originalUrl || req.url
  let ip = req.ip || req.connection?.remoteAddress || '::1'
  if (ip === '::ffff:127.0.0.1') ip = '127.0.0.1'

  res.on('finish', async () => {
    const statusCode = res.statusCode
    // Log to terminal
    console.log(`[${timestamp.toISOString()}] ${method} ${url} ${ip} HTTP ${statusCode}`)

    // Append to CSV file
    const csvLine = `${timestamp.toISOString()},${method},${url},${ip},${statusCode}\n`
    fs.appendFile(logFilePath, csvLine, (err) => {
      if (err) {
        console.error('Failed to append to request log CSV:', err.message || err)
      }
    })

    // Save request log to MongoDB requestLogs collection
    try {
      if (mongoose.connection.readyState === 1) {
        const logEntry = new RequestLog({
          timestamp,
          method,
          url,
          ip,
          statusCode
        })
        await logEntry.save()
      }
    } catch (err) {
      console.error('Failed to save request log to MongoDB:', err.message || err)
    }
  })
  next()
})

app.use(cors())

// Reject POST/PUT requests missing Content-Type: application/json
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' })
    }
  }
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Route-specific middleware: Validate Task ID format for MongoDB ObjectId
const validateTaskId = (req, res, next) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid task ID' })
  }
  next()
}

// ─── CRUD Endpoints ───

// GET /tasks - Return all tasks from MongoDB
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 })
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

// POST /tasks - Create a new task in MongoDB
app.post('/tasks', async (req, res, next) => {
  try {
    const { title } = req.body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' })
    }

    const newTask = new Task({
      title: title.trim()
    })

    await newTask.save()
    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

// PUT /tasks/:id - Update an existing task in MongoDB using ObjectId
app.put('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params
    const { title } = req.body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' })
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title: title.trim() },
      { new: true }
    )

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
})

// DELETE /tasks/:id - Delete a task from MongoDB using ObjectId
app.delete('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedTask = await Task.findByIdAndDelete(id)

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    next(err)
  }
})

// Simulated Error Trigger Route
app.get('/trigger-error', (req, res, next) => {
  const error = new Error('Simulated internal server error.')
  error.status = 500
  next(error)
})

// Status check endpoint
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Express CRUD server is running.' })
})

// Custom 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── MIDDLEWARE 2: Global Error Handler (MUST be last) ───
app.use((err, req, res, next) => {
  console.error('Captured Global Error:', err.message || err)
  res.status(500).json({ error: 'Something went wrong' })
})

// Spin up server with macOS port 5000 help handling
const server = app.listen(PORT, () => {
  console.log(`Task Management server running on http://localhost:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`)
    console.error(`On macOS, this is usually occupied by the "AirPlay Receiver" service.`)
    console.error(`To fix this and run the server on port ${PORT}:`)
    console.error(`1. Open "System Settings"`)
    console.error(`2. Go to "General" -> "AirDrop & Handoff"`)
    console.error(`3. Toggle "AirPlay Receiver" OFF.`)
    console.error(`Alternatively, you can run the server on a different port by setting the PORT environment variable: PORT=5001 node server.js\n`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
  }
})
