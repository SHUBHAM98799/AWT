import { useState, useEffect } from 'react'
import { getTasks, addTask, updateTask, deleteTask } from './Task'

export default function Todo() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Fetch tasks on component mount (Simulated GET)
  useEffect(() => {
    setTasks(getTasks())
  }, [])

  // Add a task (Simulated POST)
  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask = addTask(newTitle)
    if (newTask) {
      setTasks(getTasks()) // Refresh list
      setNewTitle('')
    }
  }

  // Update a task (Simulated PUT)
  const handleUpdateTask = (id) => {
    if (!editingTitle.trim()) return

    const updated = updateTask(id, editingTitle)
    if (updated) {
      setTasks(getTasks()) // Refresh list
      setEditingTaskId(null)
      setEditingTitle('')
    }
  }

  // Delete a task (Simulated DELETE)
  const handleDeleteTask = (id) => {
    const deleted = deleteTask(id)
    if (deleted) {
      setTasks(getTasks()) // Refresh list
    }
  }

  const startEdit = (task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  return (
    <section>
      <h2>// SYSTEM TASKS & TODO CORE</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
        Manage real-time tasks using local CRUD methods. All operations reflect instantly.
      </p>

      {/* ─── Add Task Form ─── */}
      <form onSubmit={handleAddTask} className="todo-form">
        <input
          type="text"
          className="form-control todo-input"
          placeholder="Initiate new protocol / task title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary todo-add-btn" disabled={!newTitle.trim()}>
          Add Task
        </button>
      </form>

      {/* ─── Task List Grid ─── */}
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
              <li key={task.id} className="project-card todo-card">
                {editingTaskId === task.id ? (
                  /* Edit Mode Panel */
                  <div className="todo-edit-panel">
                    <input
                      type="text"
                      className="form-control todo-edit-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                    />
                    <div className="todo-edit-actions">
                      <button
                        className="btn btn-primary todo-btn-save"
                        onClick={() => handleUpdateTask(task.id)}
                        disabled={!editingTitle.trim()}
                      >
                        Save
                      </button>
                      <button className="btn todo-btn-cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode Panel */
                  <div className="todo-display-panel">
                    <span className="todo-task-title">{task.title}</span>
                    <div className="todo-actions">
                      <button className="btn todo-btn-edit" onClick={() => startEdit(task)}>
                        {/* Edit icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button className="btn todo-btn-delete" onClick={() => handleDeleteTask(task.id)}>
                        {/* Delete icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
