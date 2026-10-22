const taskEvents = require('./events.cjs')

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

taskEvents.on('error', (error, context = {}) => {
  const eventName = context.event || 'unknown event'
  const taskId = context.taskId || 'unknown task'
  const errorName = error && error.name ? error.name : 'Error'
  console.error(`[Event] ${eventName} notification failed for task ${taskId}: ${errorName}`)
})

taskEvents.on('task-created', async (task) => {
  try {
    const notificationTimestamp = new Date().toISOString()
    const handlerStartedAt = new Date().toISOString()
    console.log(`[Notification] Handler started at: ${handlerStartedAt}`)
    console.log(`[Notification] Task "${task.title}" created for user ${task.assignedUser} at ${notificationTimestamp}`)

    await delay(2000)

    const handlerCompletedAt = new Date().toISOString()
    console.log(`[Notification] Handler completed at: ${handlerCompletedAt} | Task ID: ${task.taskId}`)
  } catch (error) {
    taskEvents.emit('error', error, { event: 'task-created', taskId: task.taskId })
  }
})

taskEvents.on('task-deleted', (task) => {
  try {
    const notificationTimestamp = new Date().toISOString()
    console.log(`[Notification] Task-deleted at: ${notificationTimestamp} | Task ID: ${task.taskId} | Title: "${task.title}" | Assigned user: ${task.assignedUser}`)
  } catch (error) {
    taskEvents.emit('error', error, { event: 'task-deleted', taskId: task.taskId })
  }
})
