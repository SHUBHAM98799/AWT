import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask, getMe, getToken, logout } from './api'

// Practical 7 - Authenticated & Validated CRUD actions with JWT
export default function Todo() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [user, setUser] = useState(null)
  
  // Loading & Connection Error States
  const [loadingGet, setLoadingGet] = useState(false)
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [loadingUpdateId, setLoadingUpdateId] = useState(null)
  const [loadingDeleteId, setLoadingDeleteId] = useState(null)
  
  const [errorGet, setErrorGet] = useState(null)

  // Toast / Notification State
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const navigate = useNavigate()

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // Handle 401 response: clear token, inform user, redirect to login
  const handle401Error = () => {
    logout()
    showToast('Session expired. Please login again.', 'error')
    setTimeout(() => {
      navigate('/login')
    }, 1000)
  }

  // Check auth and fetch user details & tasks
  const initTodo = async () => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    setLoadingGet(true)
    setErrorGet(null)

    try {
      // Fetch user profile
      const userData = await getMe()
      setUser(userData)

      // Fetch tasks
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      console.error(err)
      if (err.status === 401 || err.message?.includes('Authentication required') || err.message?.includes('Invalid or expired')) {
        handle401Error()
      } else {
        setErrorGet('Could not connect to the tasks server. Please verify the Express backend is running on port 5000.')
      }
    } finally {
      setLoadingGet(false)
    }
  }

  useEffect(() => {
    initTodo()
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  // Handle Logout
  const handleLogout = () => {
    logout()
    setUser(null)
    showToast('Logged out successfully.', 'success')
    navigate('/login')
  }

  // Add a task with Optimistic UI (POST)
  const handleAddTask = async (e) => {
    if (e) e.preventDefault()
    if (editingTaskId) return // Safety: do not POST when in edit mode

    const titleToAdd = newTitle.trim()
    if (!titleToAdd) return

    setLoadingAdd(true)
    
    // Create temporary optimistic task
    const tempId = `temp-${Date.now()}`
    const tempTask = {
      _id: tempId,
      title: titleToAdd,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    }

    // Optimistically update UI list
    setTasks((prev) => [...prev, tempTask])
    setNewTitle('')

    try {
      const createdTask = await createTask(titleToAdd)
      // Replace optimistic task with actual DB task
      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? createdTask : t))
      )
      showToast('Task created successfully.', 'success')
    } catch (err) {
      console.error(err)
      // Revert optimistic update
      setTasks((prev) => prev.filter((t) => t._id !== tempId))
      // Recover input text
      setNewTitle(titleToAdd)

      if (err.status === 401) {
        handle401Error()
      } else {
        showToast(err.message || 'Failed to create task.', 'error')
      }
    } finally {
      setLoadingAdd(false)
    }
  }

  // Update a task (PUT)
  const handleUpdateTask = async (e) => {
    if (e) e.preventDefault()
    const id = editingTaskId
    const titleToUpdate = newTitle.trim()
    if (!id || !titleToUpdate) return

    // Show a confirmation dialog before sending PUT
    const confirmUpdate = window.confirm('Are you sure you want to update this task?')
    if (!confirmUpdate) {
      cancelEdit()
      return
    }

    setLoadingUpdateId(id)
    try {
      const updated = await updateTask(id, titleToUpdate)
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)))
      cancelEdit()
      showToast('Task updated successfully.', 'success')
    } catch (err) {
      console.error(err)
      if (err.status === 401) {
        handle401Error()
      } else {
        showToast(err.message || 'Failed to update task.', 'error')
      }
    } finally {
      setLoadingUpdateId(null)
    }
  }

  // Delete a task (DELETE)
  const handleDeleteTask = async (id) => {
    // Show confirmation dialog before deleting
    const confirmDelete = window.confirm('Are you sure you want to delete this task?')
    if (!confirmDelete) return

    setLoadingDeleteId(id)
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
      showToast('Task deleted successfully.', 'success')
      if (editingTaskId === id) {
        cancelEdit()
      }
    } catch (err) {
      console.error(err)
      if (err.status === 401) {
        handle401Error()
      } else {
        showToast(err.message || 'Failed to delete task.', 'error')
      }
    } finally {
      setLoadingDeleteId(null)
    }
  }

  const startEdit = (task) => {
    setEditingTaskId(task._id)
    setNewTitle(task.title)
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setNewTitle('')
  }

  const isPending = loadingAdd || loadingUpdateId !== null || loadingDeleteId !== null

  if (!getToken()) {
    return (
      <section style={{ textAlign: 'center', margin: '3rem auto', maxWidth: '500px' }}>
        <h2>// AUTHENTICATION REQUIRED</h2>
        <p className="about-text" style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          You must be logged in to view and manage tasks.
        </p>
        <Link to="/login" className="btn btn-primary">
          Proceed to Login
        </Link>
      </section>
    )
  }

  return (
    <section>
      {/* ─── Header Auth Status Banner ─── */}
      <div 
        className="project-card" 
        style={{ 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          padding: '0.8rem 1.2rem', 
          marginBottom: '1.5rem',
          borderColor: 'var(--surface-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ color: 'var(--muted)' }}>Authenticated User:</span>
          <strong style={{ color: 'var(--accent)' }}>{user?.email || 'Loading user...'}</strong>
        </div>
        <button 
          className="btn" 
          onClick={handleLogout}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          Logout
        </button>
      </div>

      <h2>// SYSTEM TASKS & TODO CORE (AUTHENTICATED)</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
        Manage real-time tasks using Express REST API backend with JWT Authorization middleware.
      </p>

      {/* ─── Add / Edit Task Form ─── */}
      <form onSubmit={editingTaskId ? handleUpdateTask : handleAddTask} className="todo-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {editingTaskId && (
          <div className="editing-indicator" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            Protocol Edit Active: Modifying selected task title
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <input
            type="text"
            className="form-control todo-input"
            placeholder={
              loadingAdd || loadingUpdateId 
                ? "Processing..." 
                : editingTaskId 
                  ? "Update task title..." 
                  : "Initiate new protocol / task title..."
            }
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={loadingGet || isPending}
            style={{ flexGrow: 1 }}
          />
          <button 
            type="submit" 
            className="btn btn-primary todo-add-btn" 
            disabled={loadingGet || isPending || !newTitle.trim()}
          >
            {editingTaskId 
              ? (loadingUpdateId ? 'Updating...' : 'Update Task') 
              : (loadingAdd ? 'Adding...' : 'Add Task')
            }
          </button>
          {editingTaskId && (
            <button 
              type="button" 
              className="btn todo-btn-cancel" 
              onClick={cancelEdit}
              disabled={isPending}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* ─── Initial Loading State ─── */}
      {loadingGet && (
        <div className="github-status">
          <div className="loading-spinner" />
          <p>Loading tasks...</p>
        </div>
      )}

      {/* ─── Connection Error State ─── */}
      {errorGet && !loadingGet && (
        <div className="github-status github-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{errorGet}</p>
          <button className="btn btn-primary" onClick={initTodo}>
            Retry Sync
          </button>
        </div>
      )}

      {/* ─── Task List Grid ─── */}
      {!loadingGet && !errorGet && (
        <div className="todo-results">
          {tasks.length === 0 ? (
            <div className="github-status github-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>No active tasks in system database.</p>
            </div>
          ) : (
            <ul className="todo-grid">
              {tasks.map((task) => (
                <li 
                  key={task._id} 
                  className="project-card todo-card" 
                  style={{ 
                    opacity: task.isOptimistic ? 0.7 : 1,
                    border: editingTaskId === task._id ? '1px solid var(--accent)' : '1px solid var(--border)' 
                  }}
                >
                  <div className="todo-display-panel">
                    <span className="todo-task-title" style={{ fontStyle: task.isOptimistic ? 'italic' : 'normal' }}>
                      {task.title} {task.isOptimistic && ' (Syncing...)'}
                      {editingTaskId === task._id && ' (Editing)'}
                    </span>
                    <div className="todo-actions">
                      <button 
                        className="btn todo-btn-edit" 
                        onClick={() => startEdit(task)}
                        disabled={isPending || task.isOptimistic}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="btn todo-btn-delete" 
                        onClick={() => handleDeleteTask(task._id)}
                        disabled={isPending || task.isOptimistic}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        {loadingDeleteId === task._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Toast Notification Box */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </section>
  )
}
