const taskEvents = require('./events.cjs')

const delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

taskEvents.on('error', (error, context = {}) => {
  const eventName = context.event || 'unknown event'
  const taskId = context.taskId || 'unknown task'
  const errorName = error && error.name ? error.name : 'Error'
  console.error(`[Event] ${eventName} failed for ${taskId} (${errorName})`)
})

taskEvents.on('task-created', async (task) => {
  try {
    const notificationTimestamp = new Date().toISOString()
    console.log(`[Event] task-created received at ${notificationTimestamp} | Task: "${task.title}" | Assigned user: ${task.assignedUser}`)

    const handlerStartTimestamp = new Date().toISOString()
    console.log(`[Event] task-created handler started at ${handlerStartTimestamp} | Task ID: ${task.taskId}`)

    await delay(2000)

    const handlerCompletionTimestamp = new Date().toISOString()
    console.log(`[Event] task-created handler completed at ${handlerCompletionTimestamp} | Task ID: ${task.taskId}`)
  } catch (error) {
    taskEvents.emit('error', error, { event: 'task-created', taskId: task.taskId })
  }
})


taskEvents.on('task-deleted', (task) => {
  try {
    const notificationTimestamp = new Date().toISOString()
    console.log(`[Event] task-deleted notification at ${notificationTimestamp} | Task ID: ${task.taskId} | Task: "${task.title}" | Assigned user: ${task.assignedUser}`)
  } catch (error) {
    taskEvents.emit('error', error, { event: 'task-deleted', taskId: task.taskId })
  }
})
