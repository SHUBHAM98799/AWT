const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 5000

// In-memory task array (NO DATABASE)
let tasks = [
  { id: 1, title: 'Learn React component architecture' },
  { id: 2, title: 'Design a responsive dashboard' },
  { id: 3, title: 'Prepare for Practical examination' }
]

// ─── MIDDLEWARE 1: Global Request Logger ───
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`)
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

// Route-specific middleware: Validate Task ID format
const validateTaskId = (req, res, next) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id) || id.toString() !== req.params.id) {
    return res.status(400).json({ error: 'Invalid task ID format. Must be an integer.' })
  }
  next()
}

// ─── CRUD Endpoints ───

// GET /tasks - Return all tasks
app.get('/tasks', (req, res) => {
  try {
    res.status(200).json(tasks)
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  try {
    const { title } = req.body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' })
    }

    const newTask = {
      id: Date.now(),
      title: title.trim()
    }

    tasks.push(newTask)
    res.status(201).json(newTask)
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', validateTaskId, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { title } = req.body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' })
    }

    const taskIndex = tasks.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ error: `Task with id ${id} not found.` })
    }

    tasks[taskIndex].title = title.trim()
    res.status(200).json(tasks[taskIndex])
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', validateTaskId, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const taskIndex = tasks.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ error: `Task with id ${id} not found.` })
    }

    tasks.splice(taskIndex, 1)
    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
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
    console.error(`Alternatively, you can run the server on a different port by setting the PORT environment variable: PORT=5001 node server.js\n`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
  }
})
