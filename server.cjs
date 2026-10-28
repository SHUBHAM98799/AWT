const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const NodeCache = require('node-cache')
const crypto = require('node:crypto')
const taskEvents = require('./events.cjs')
const { generateTaskDescription } = require('./ai.cjs')
require('./listeners.cjs')

// ─── IN-MEMORY CACHE (Practical 9) ───
// TTL: 60 seconds, check for expired keys every 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 })

// Cache hit/miss statistics counters
const cacheStats = {
  hits: 0,
  misses: 0,
  get lookups() { return this.hits + this.misses },
  get hitRatio() {
    const total = this.hits + this.misses
    return total === 0 ? 0 : parseFloat((this.hits / total).toFixed(4))
  }
}

const app = express()
const PORT = process.env.PORT || 5000
const AI_RATE_LIMIT_MS = 60 * 1000
const AI_RATE_LIMIT_MAX_ENTRIES = 500
const aiRequestTimes = new Map()

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

if (require.main === module) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully')
    })
    .catch((err) => {
      console.error('MongoDB connection error: Could not connect to the configured database')
      console.error(err.message || err)
    })
}

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
  description: {
    type: String,
    trim: true,
    default: ''
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
  const { title, status, description } = req.body || {}
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
  if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) {
    return res.status(400).json({ error: 'Task description must be 2000 characters or fewer' })
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

app.locals.generateTaskDescription = generateTaskDescription
app.locals.aiRequestTimes = aiRequestTimes

app.post('/api/ai/generate-description', authenticateToken, async (req, res) => {
  const title = req.body?.title
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' })
  }

  const normalizedTitle = title.trim()
  if (normalizedTitle.length > 200) {
    return res.status(400).json({ error: 'Task title must be 200 characters or fewer' })
  }
  if (!req.user.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const limiterKey = crypto
    .createHash('sha256')
    .update(`${req.user.id}\0${normalizedTitle.toLowerCase()}`)
    .digest('hex')
  const now = Date.now()
  const requestTimes = app.locals.aiRequestTimes

  for (const [key, timestamp] of requestTimes) {
    if (now - timestamp >= AI_RATE_LIMIT_MS) requestTimes.delete(key)
  }

  const previousRequest = requestTimes.get(limiterKey)
  if (previousRequest !== undefined) {
    const retryAfter = Math.max(1, Math.ceil((AI_RATE_LIMIT_MS - (now - previousRequest)) / 1000))
    res.setHeader('Retry-After', retryAfter)
    return res.status(429).json({
      description: '',
      fallback: true,
      message: 'Please wait before requesting another suggestion for this task.'
    })
  }

  if (requestTimes.size >= AI_RATE_LIMIT_MAX_ENTRIES) {
    requestTimes.delete(requestTimes.keys().next().value)
  }
  requestTimes.set(limiterKey, now)

  try {
    const description = await app.locals.generateTaskDescription(normalizedTitle)
    if (typeof description !== 'string' || !description.trim() || description.length > 2000) {
      throw new Error('AI provider returned an invalid task description')
    }
    return res.status(200).json({ description: description.trim(), fallback: false })
  } catch {
    return res.status(503).json({
      description: '',
      fallback: true,
      message: 'AI suggestions are temporarily unavailable. You can enter the description manually.'
    })
  }
})

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

// GET /tasks - Return all tasks from MongoDB with in-memory caching (Practical 9)
app.get('/tasks', authenticateToken, async (req, res, next) => {
  try {
    const bypassCache = req.query.noCache === 'true' || req.headers['cache-control'] === 'no-cache'
    const cacheKey = 'all_tasks'
    const cached = bypassCache ? undefined : cache.get(cacheKey)

    if (cached !== undefined) {
      // Cache HIT — return cached tasks without a DB query
      cacheStats.hits++
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('X-Cache-TTL-Remaining', cache.getTtl(cacheKey) - Date.now())
      return res.status(200).json(cached)
    }

    // Cache MISS or UNCACHED — query MongoDB
    if (!bypassCache) cacheStats.misses++
    const tasks = await Task.find().sort({ createdAt: 1 })
    if (!bypassCache) cache.set(cacheKey, tasks)
    res.setHeader('X-Cache', bypassCache ? 'UNCACHED' : 'MISS')
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

// GET /tasks/:id - Return a single task by ID with caching (Practical 9)
app.get('/tasks/:id', authenticateToken, validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params
    const cacheKey = `task_${id}`
    const cached = cache.get(cacheKey)

    if (cached !== undefined) {
      // Cache HIT
      cacheStats.hits++
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).json(cached)
    }

    // Cache MISS — query MongoDB
    cacheStats.misses++
    const task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    cache.set(cacheKey, task)
    res.setHeader('X-Cache', 'MISS')
    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
})

// POST /tasks - Create a new task in MongoDB; invalidates task-list cache (Practical 9)
app.post('/tasks', authenticateToken, validateTaskInput, async (req, res, next) => {
  try {
    const { title, status, description } = req.body
    const taskData = { title: title.trim() }
    if (description !== undefined) taskData.description = description.trim()
    if (status) {
      taskData.status = status.trim().toLowerCase()
    }

    const newTask = new Task(taskData)
    await newTask.save()

    // Invalidate task-list cache after successful save
    cache.del('all_tasks')

    const eventPayload = {
      taskId: newTask._id.toString(),
      title: newTask.title,
      assignedUser: String(req.user.id),
      notificationTimestamp: new Date().toISOString()
    }
    console.log(`[API] Task saved at: ${new Date().toISOString()}`)

    res.once('finish', () => {
      console.log(`[API] Response sent at: ${new Date().toISOString()}`)
      setImmediate(() => taskEvents.emit('task-created', eventPayload))
    })
    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

// PUT /tasks/:id - Update an existing task; invalidates list + individual cache (Practical 9)
app.put('/tasks/:id', authenticateToken, validateTaskId, validateTaskInput, async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, status, description } = req.body

    const updateData = {}
    if (title !== undefined && title.trim() !== '') {
      updateData.title = title.trim()
    }
    if (description !== undefined) {
      updateData.description = description.trim()
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

    // Invalidate both list cache and this task's individual cache after successful update
    cache.del('all_tasks')
    cache.del(`task_${id}`)

    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
})

// DELETE /tasks/:id - Delete a task; invalidates list + individual cache (Practical 9)
app.delete('/tasks/:id', authenticateToken, validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedTask = await Task.findByIdAndDelete(id)

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Invalidate both list cache and the deleted task's individual cache (Practical 9)
    cache.del('all_tasks')
    cache.del(`task_${id}`)

    const eventPayload = {
      taskId: deletedTask._id.toString(),
      title: deletedTask.title,
      assignedUser: String(req.user.id)
    }

    res.once('finish', () => {
      setImmediate(() => taskEvents.emit('task-deleted', eventPayload))
    })
    res.status(200).json({
      message: 'Task deleted successfully',
      deletedId: id,
      cacheInvalidated: ['all_tasks', `task_${id}`]
    })
  } catch (err) {
    next(err)
  }
})

// GET /debug/cache-stats - Cache hit/miss statistics (Practical 9 debug endpoint)
app.get('/debug/cache-stats', (req, res) => {
  const nodeCacheStats = cache.getStats()
  res.status(200).json({
    cacheHits: cacheStats.hits,
    cacheMisses: cacheStats.misses,
    totalLookups: cacheStats.lookups,
    hitRatio: cacheStats.hitRatio,
    hitPercentage: `${(cacheStats.hitRatio * 100).toFixed(2)}%`,
    cachedKeys: cache.keys(),
    nodeCacheInternalStats: {
      hits: nodeCacheStats.hits,
      misses: nodeCacheStats.misses,
      keys: nodeCacheStats.keys,
      ksize: nodeCacheStats.ksize,
      vsize: nodeCacheStats.vsize
    },
    ttlSeconds: 60,
    note: 'node-cache is process-local; cache clears on server restart and is not shared across multiple server instances'
  })
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
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body' })
  }
  console.error('Captured Global Error:', err.message || err)
  res.status(500).json({ error: 'Something went wrong' })
})

if (require.main === module) {
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
}

module.exports = app
