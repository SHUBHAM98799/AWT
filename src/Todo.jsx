import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask, generateTaskDescription, getMe, getToken, logout } from './api'

// Practical 8 - Task Status Board Component
export default function Todo() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  
  // Edit state for title, description, and status
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('pending')

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
    navigate('/login', { replace: true, state: { message: 'Session expired. Please login again.' } })
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

      // Fetch tasks from MongoDB
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

  // Add a task with Optimistic UI (POST) - Default status: pending
  const handleAddTask = async (e) => {
    if (e) e.preventDefault()

    const titleToAdd = newTitle.trim()
    const descriptionToAdd = newDescription.trim()
    if (!titleToAdd) return

    setLoadingAdd(true)
    
    // Create temporary optimistic task
    const tempId = `temp-${Date.now()}`
    const tempTask = {
      _id: tempId,
      title: titleToAdd,
      description: descriptionToAdd,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isOptimistic: true
    }

    // Optimistically update main task list
    setTasks((prev) => [...prev, tempTask])
    setNewTitle('')
    setNewDescription('')
    setAiFeedback(null)

    try {
      const createdTask = await createTask(titleToAdd, 'pending', descriptionToAdd)
      // Replace optimistic task with actual DB task
      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? createdTask : t))
      )
      showToast('Task created successfully in Pending status.', 'success')
    } catch (err) {
      console.error(err)
      // Revert optimistic update
      setTasks((prev) => prev.filter((t) => t._id !== tempId))
      // Recover input text
      setNewTitle(titleToAdd)
      setNewDescription(descriptionToAdd)

      if (err.status === 401) {
        handle401Error()
      } else {
        showToast(err.message || 'Failed to create task.', 'error')
      }
    } finally {
      setLoadingAdd(false)
    }
  }

  const handleGenerateDescription = async () => {
    const title = newTitle.trim()
    if (!title) {
      setAiFeedback({ type: 'error', message: 'Enter a task title before requesting a description.' })
      return
    }

    setAiLoading(true)
    setAiFeedback(null)
    try {
      const result = await generateTaskDescription(title)
      if (result.fallback || !result.description?.trim()) {
        setAiFeedback({
          type: 'fallback',
          message: result.message || 'AI suggestions are temporarily unavailable. You can enter a description manually.'
        })
        return
      }
      setNewDescription(result.description)
      setAiFeedback({ type: 'success', message: 'AI suggestion ready. Review and edit it before saving.' })
    } catch (err) {
      if (err.status === 401) handle401Error()
      setAiFeedback({
        type: 'fallback',
        message: err.message || 'AI suggestions are temporarily unavailable. You can enter a description manually.'
      })
    } finally {
      setAiLoading(false)
    }
  }

  const startEdit = (task) => {
    setEditingTaskId(task._id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditStatus(task.status || 'pending')
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditStatus('pending')
  }

  const handleUpdateTask = async (e, id) => {
    if (e) e.preventDefault()
    const targetId = id || editingTaskId
    const titleToUpdate = editTitle.trim()
    
    if (!targetId || !titleToUpdate) return

    // Confirmation dialog before updating
    const confirmUpdate = window.confirm('Are you sure you want to update this task?')
    if (!confirmUpdate) {
      return
    }

    setLoadingUpdateId(targetId)
    try {
      const updated = await updateTask(targetId, titleToUpdate, editStatus, editDescription)
      // Update main tasks state -> derived columns recalculate automatically!
      setTasks((prev) => prev.map((t) => (t._id === targetId ? updated : t)))
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

  const isPendingState = loadingAdd || loadingUpdateId !== null || loadingDeleteId !== null

  // Single Source of Truth: derive the 3 status section arrays
  const pendingTasks = tasks.filter((t) => (t.status || 'pending') === 'pending')
  const ongoingTasks = tasks.filter((t) => t.status === 'ongoing')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

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

  // Helper to render individual Task Cards
  const renderTaskCard = (task) => {
    const isEditing = editingTaskId === task._id
    const currentStatus = task.status || 'pending'

    if (isEditing) {
      return (
        <div key={task._id} className="status-task-card editing-card">
          <form onSubmit={(e) => handleUpdateTask(e, task._id)} className="task-edit-form">
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-h)' }}>Task Title:</label>
              <input
                type="text"
                id={`edit-task-title-${task._id}`}
                name="task-title"
                aria-label="Edit task title"
                className="form-control todo-edit-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                disabled={loadingUpdateId === task._id}
              />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label htmlFor={`edit-task-description-${task._id}`}>Description:</label>
              <textarea
                id={`edit-task-description-${task._id}`}
                className="form-control todo-edit-input todo-description-input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={2000}
                disabled={loadingUpdateId === task._id}
              />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-h)' }}>Status:</label>
              <select
                className="form-control todo-edit-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={loadingUpdateId === task._id}
              >
                <option value="pending">🟡 Pending</option>
                <option value="ongoing">🔵 Ongoing</option>
                <option value="completed">🟢 Completed</option>
              </select>
            </div>
            <div className="task-edit-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary todo-btn-save"
                disabled={loadingUpdateId === task._id || !editTitle.trim()}
              >
                {loadingUpdateId === task._id ? 'Updating...' : 'Update Task'}
              </button>
              <button
                type="button"
                className="btn todo-btn-cancel"
                onClick={cancelEdit}
                disabled={loadingUpdateId === task._id}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )
    }

    return (
      <div 
        key={task._id} 
        className={`status-task-card card-${currentStatus}`}
        style={{ opacity: task.isOptimistic ? 0.7 : 1 }}
      >
        <div className="task-card-header">
          <h4 className={`task-card-title ${currentStatus === 'completed' ? 'title-completed' : ''}`}>
            {task.title} {task.isOptimistic && ' (Syncing...)'}
          </h4>
        </div>
        
        <div className="task-card-badge-row">
          {currentStatus === 'pending' && <span className="status-badge badge-pending">🟡 Pending</span>}
          {currentStatus === 'ongoing' && <span className="status-badge badge-ongoing">🔵 Ongoing</span>}
          {currentStatus === 'completed' && <span className="status-badge badge-completed">🟢 Completed</span>}
        </div>

        {task.description && <p className="task-card-description">{task.description}</p>}

        <div className="task-card-actions">
          <button 
            className="btn todo-btn-edit" 
            onClick={() => startEdit(task)}
            disabled={isPendingState || task.isOptimistic}
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
            disabled={isPendingState || task.isOptimistic}
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
    )
  }

  return (
    <section>
      {/* ─── Header Auth Status Banner ─── */}
      <div 
        className="project-card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.8rem 1.2rem', 
          marginBottom: '1rem',
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

      <div className="status-board-header">
        <h2>// TASK MANAGEMENT BOARD</h2>
        <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          Real-time Task Status Board powered by Express & MongoDB. Tasks are segregated automatically across three status columns.
        </p>
      </div>

      {/* ─── Add Task Form (Creates task in default status: pending) ─── */}
      <form onSubmit={handleAddTask} className="todo-form todo-create-form" style={{ marginBottom: '2rem' }}>
        <label className="sr-only" htmlFor="new-task-title">Task title</label>
        <input
          type="text"
          id="new-task-title"
          name="new-task-title"
          aria-label="New task title"
          className="form-control todo-input"
          placeholder={loadingAdd ? "Creating task..." : "Create new task title (defaults to Pending)..."}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={loadingGet || isPendingState || aiLoading}
          maxLength={200}
          style={{ flexGrow: 1 }}
        />
        <label className="sr-only" htmlFor="new-task-description">Task description</label>
        <textarea
          id="new-task-description"
          name="new-task-description"
          className="form-control todo-description-input"
          placeholder="Add a description or generate an editable suggestion..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          maxLength={2000}
          disabled={loadingGet || isPendingState}
        />
        <p className="ai-disclaimer">AI-generated content may be inaccurate. Review and edit before saving.</p>
        {aiFeedback && (
          <p className={`ai-feedback ai-feedback-${aiFeedback.type}`} role="status">
            {aiFeedback.message}
          </p>
        )}
        <div className="todo-create-actions">
          <button
            type="button"
            className="btn ai-generate-btn"
            onClick={handleGenerateDescription}
            disabled={loadingGet || isPendingState || aiLoading || !newTitle.trim()}
          >
            {aiLoading ? 'Generating...' : 'Generate Description'}
          </button>
          <button
            type="submit"
            className="btn btn-primary todo-add-btn"
            disabled={loadingGet || isPendingState || aiLoading || !newTitle.trim()}
          >
            {loadingAdd ? 'Adding...' : '+ Create Task'}
          </button>
        </div>
      </form>

      {/* ─── Loading State ─── */}
      {loadingGet && (
        <div className="github-status">
          <div className="loading-spinner" />
          <p>Loading tasks from MongoDB...</p>
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

      {/* ─── 3-SECTION STATUS BOARD (ALL VISIBLE SIMULTANEOUSLY) ─── */}
      {!loadingGet && !errorGet && (
        <div className="status-board-grid">
          
          {/* SECTION 1: PENDING */}
          <div className="status-column column-pending">
            <div className="column-header header-pending">
              <span className="status-dot dot-pending">🟡</span>
              <span className="column-title">PENDING</span>
              <span className="column-count count-pending">({pendingTasks.length})</span>
            </div>
            <div className="column-cards-container">
              {pendingTasks.length === 0 ? (
                <div className="empty-column-msg">No pending tasks</div>
              ) : (
                pendingTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>

          {/* SECTION 2: ONGOING */}
          <div className="status-column column-ongoing">
            <div className="column-header header-ongoing">
              <span className="status-dot dot-ongoing">🔵</span>
              <span className="column-title">ONGOING</span>
              <span className="column-count count-ongoing">({ongoingTasks.length})</span>
            </div>
            <div className="column-cards-container">
              {ongoingTasks.length === 0 ? (
                <div className="empty-column-msg">No ongoing tasks</div>
              ) : (
                ongoingTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>

          {/* SECTION 3: COMPLETED */}
          <div className="status-column column-completed">
            <div className="column-header header-completed">
              <span className="status-dot dot-completed">🟢</span>
              <span className="column-title">COMPLETED</span>
              <span className="column-count count-completed">({completedTasks.length})</span>
            </div>
            <div className="column-cards-container">
              {completedTasks.length === 0 ? (
                <div className="empty-column-msg">No completed tasks</div>
              ) : (
                completedTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>

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
