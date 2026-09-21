const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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

// User Model for Practical 7 Authentication
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})
const User = mongoose.model('User', userSchema, 'users')

// Task Model with Practical 8 Status field
const VALID_STATUSES = ['pending', 'ongoing', 'completed']

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'pending'
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

// ─── VALIDATION & AUTHENTICATION MIDDLEWARES ───

// Validation middleware for Auth (register/login)
const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body || {}
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' })
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Password is required' })
  }
  next()
}

// Validation middleware for Task creation/update
const validateTaskInput = (req, res, next) => {
  const { title, status } = req.body || {}
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }
  }
  if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Task title cannot be empty' })
    }
  }
  if (status !== undefined) {
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, ongoing, or completed' })
    }
  }
  next()
}

// Route-specific middleware: Validate Task ID format for MongoDB ObjectId
const validateTaskId = (req, res, next) => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid task ID' })
  }
  next()
}

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── AUTHENTICATION ENDPOINTS ───

// POST /register - Register a new user with bcrypt password hash
app.post('/register', validateAuthInput, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10)
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword
    })

    await newUser.save()
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        email: newUser.email
      }
    })
  } catch (err) {
    next(err)
  }
})

// POST /login - Authenticate user & return JWT token
app.post('/login', validateAuthInput, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: '1h' }
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email
      }
    })
  } catch (err) {
    next(err)
  }
})

// GET /me - Return authenticated user details (protected)
app.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(200).json({
      _id: user._id,
      email: user.email
    })
  } catch (err) {
    next(err)
  }
})

// ─── PROTECTED TASK CRUD Endpoints ───

// GET /tasks - Return all tasks from MongoDB (protected)
app.get('/tasks', authenticateToken, async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 })
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

// POST /tasks - Create a new task in MongoDB (protected)
app.post('/tasks', authenticateToken, validateTaskInput, async (req, res, next) => {
  try {
    const { title, status } = req.body
    const taskData = { title: title.trim() }
    if (status) {
      taskData.status = status.trim().toLowerCase()
    }

    const newTask = new Task(taskData)
    await newTask.save()
    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

// PUT /tasks/:id - Update an existing task in MongoDB using ObjectId (protected)
app.put('/tasks/:id', authenticateToken, validateTaskId, validateTaskInput, async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, status } = req.body

    const updateData = {}
    if (title !== undefined && title.trim() !== '') {
      updateData.title = title.trim()
    }
    if (status !== undefined) {
      updateData.status = status.trim().toLowerCase()
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' })
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
})

// DELETE /tasks/:id - Delete a task from MongoDB using ObjectId (protected)
app.delete('/tasks/:id', authenticateToken, validateTaskId, async (req, res, next) => {
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
