const express = require('express')
const router = express.Router()

// In-memory task array
let tasks = [
  { id: 1, title: 'Explore futuristic theme design patterns' },
  { id: 2, title: 'Build Express REST API for Todo application' },
  { id: 3, title: 'Implement custom logger middleware' }
]

// GET /tasks - Return all tasks
router.get('/', (req, res) => {
  res.status(200).json(tasks)
})

// POST /tasks - Create a new task
router.post('/', (req, res) => {
  const { title } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required and must be a valid string.' })
  }

  const newTask = {
    id: Date.now(),
    title: title.trim()
  }

  tasks.push(newTask)
  res.status(201).json(newTask)
})

// PUT /tasks/:id - Update an existing task
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { title } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required and must be a valid string.' })
  }

  const taskIndex = tasks.findIndex((t) => t.id === id)

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with id ${id} not found.` })
  }

  tasks[taskIndex].title = title.trim()
  res.status(200).json(tasks[taskIndex])
})

// DELETE /tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const taskIndex = tasks.findIndex((t) => t.id === id)

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with id ${id} not found.` })
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0]
  res.status(200).json(deletedTask)
})

module.exports = router
