const BASE_URL = 'http://localhost:5000';

/**
 * GET - Fetch all tasks from MongoDB
 */
export async function getTasks() {
  const response = await fetch(`${BASE_URL}/tasks`);
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to fetch tasks: ${response.status}`);
  }
  return response.json();
}

/**
 * POST - Create a new task in MongoDB
 */
export async function createTask(title) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: title.trim() })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create task: ${response.status}`);
  }

  return response.json();
}

/**
 * PUT - Update an existing task in MongoDB
 */
export async function updateTask(id, title) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: title.trim() })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update task: ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE - Delete a task from MongoDB
 */
export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete task: ${response.status}`);
  }

  return response.json();
}
