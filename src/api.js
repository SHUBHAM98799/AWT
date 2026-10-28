const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

/**
 * Token management helpers
 */
export function getToken() {
  return localStorage.getItem('jwt_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('jwt_token', token);
  }
}

export function removeToken() {
  localStorage.removeItem('jwt_token');
}

/**
 * Helper to build auth headers
 */
function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle API responses and detect 401 Unauthorized
 */
async function handleResponse(response) {
  if (response.status === 401) {
    removeToken();
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Authentication required');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * POST - Register new user
 */
export async function register(email, password) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email.trim(), password: password.trim() })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Registration failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * POST - Login user & store JWT token
 */
export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email.trim(), password: password.trim() })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid credentials');
  }

  const data = await response.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

/**
 * GET - Fetch current user info (/me)
 */
export async function getMe() {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

/**
 * GET - Fetch all tasks from MongoDB (Protected)
 */
export async function getTasks() {
  const response = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

/**
 * POST - Generate an optional task description using the authenticated backend
 */
export async function generateTaskDescription(title) {
  const response = await fetch(`${BASE_URL}/api/ai/generate-description`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ title: title.trim() })
  });

  return handleResponse(response);
}

/**
 * POST - Create a new task in MongoDB (Protected)
 */
export async function createTask(title, status = 'pending', description = '') {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ title: title.trim(), status, description: description.trim() })
  });

  return handleResponse(response);
}

/**
 * PUT - Update an existing task in MongoDB (Protected)
 */
export async function updateTask(id, title, status, description) {
  const payload = {};
  if (title !== undefined) payload.title = title.trim();
  if (status !== undefined) payload.status = status;
  if (description !== undefined) payload.description = description;

  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}

/**
 * DELETE - Delete a task from MongoDB (Protected)
 */
export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

/**
 * Logout helper
 */
export function logout() {
  removeToken();
}
