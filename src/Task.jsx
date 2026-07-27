// In-memory array to store tasks (no database)
let tasks = [
  { id: 1, title: 'Learn React component architecture' },
  { id: 2, title: 'Design a responsive dashboard' },
  { id: 3, title: 'Prepare for Practical examination' }
]

/**
 * GET - Return all tasks
 */
export function getTasks() {
  return [...tasks]
}

/**
 * POST - Create a new task
 */
export function addTask(title) {
  if (!title || !title.trim()) return null

  const newTask = {
    id: Date.now(),
    title: title.trim()
  }

  tasks.push(newTask)
  return newTask
}

/**
 * PUT - Update an existing task
 */
export function updateTask(id, title) {
  if (!title || !title.trim()) return null

  const taskIndex = tasks.findIndex((t) => t.id === id)
  if (taskIndex !== -1) {
    tasks[taskIndex].title = title.trim()
    return tasks[taskIndex]
  }

  return null
}

/**
 * DELETE - Delete a task
 */
export function deleteTask(id) {
  const taskIndex = tasks.findIndex((t) => t.id === id)
  if (taskIndex !== -1) {
    return tasks.splice(taskIndex, 1)[0]
  }

  return null
}
