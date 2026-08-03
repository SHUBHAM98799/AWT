const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/tasks`
  }
  return 'http://localhost:5000/tasks'
}

const API_BASE_URL = getApiBaseUrl()


/**
 * GET - Return all tasks from the Express backend
 */
export async function getTasks() {
  const response = await fetch(API_BASE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }
  return response.json()
}

/**
 * POST - Create a new task in the Express backend
 */
export async function addTask(title) {
  if (!title || !title.trim()) return null

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.trim() })
  })

  if (!response.ok) {
    throw new Error(`Failed to add task: ${response.statusText}`)
  }

  return response.json()
}

/**
 * PUT - Update an existing task in the Express backend
 */
export async function updateTask(id, title) {
  if (!title || !title.trim()) return null

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.trim() })
  })

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`)
  }

  return response.json()
}

/**
 * DELETE - Delete a task from the Express backend
 */
export async function deleteTask(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.statusText}`)
  }

  return response.json()
}
