const assert = require('node:assert/strict')
const test = require('node:test')
const taskEvents = require('../events.cjs')
require('../listeners.cjs')

test('task notifications run separately from event dispatch and handle errors', async () => {
  assert.equal(taskEvents.listenerCount('task-created'), 1)
  assert.equal(taskEvents.listenerCount('task-deleted'), 1)
  assert.equal(taskEvents.listenerCount('error'), 1)

  const messages = []
  const errors = []
  const originalLog = console.log
  const originalError = console.error
  const startedAt = Date.now()

  try {
    console.log = (...values) => messages.push(values.join(' '))
    const emittedAt = Date.now()
    taskEvents.emit('task-created', {
      taskId: 'task-created-test',
      title: 'Async test task',
      assignedUser: 'user-test',
      notificationTimestamp: new Date().toISOString()
    })
    assert.ok(Date.now() - emittedAt < 500, 'emit should return before the notification delay')

    taskEvents.emit('task-deleted', {
      taskId: 'task-deleted-test',
      title: 'Deleted test task',
      assignedUser: 'user-test'
    })

    console.log = () => {
      throw new Error('simulated listener failure')
    }
    console.error = (...values) => errors.push(values.join(' '))
    taskEvents.emit('task-created', {
      taskId: 'task-error-test',
      get title() { throw new Error('simulated listener failure') },
      assignedUser: 'user-test',
      notificationTimestamp: new Date().toISOString()
    })
    console.log = (...values) => messages.push(values.join(' '))

    await new Promise(resolve => setTimeout(resolve, 2100))
  } finally {
    console.log = originalLog
    console.error = originalError
  }

  assert.ok(messages.some(message => message.includes('Handler started at:')))
  assert.ok(messages.some(message => message.includes('Async test task') && message.includes('user-test')))
  assert.ok(messages.some(message => message.includes('Handler completed at:') && message.includes('task-created-test')))
  assert.ok(messages.some(message => message.includes('Task-deleted') && message.includes('task-deleted-test')))
  assert.ok(errors.some(message => message.includes('task-created notification failed for task task-error-test')))
  assert.ok(Date.now() - startedAt >= 1900, 'notification completion should follow the two-second delay')
})
