const assert = require('node:assert/strict')
const test = require('node:test')
const taskEvents = require('../events.cjs')
require('../listeners.cjs')

test('task events notify asynchronously and route listener failures safely', async () => {
  assert.equal(taskEvents.listenerCount('task-created'), 1)
  assert.equal(taskEvents.listenerCount('task-deleted'), 1)
  assert.equal(taskEvents.listenerCount('error'), 1)

  const logMessages = []
  const errorMessages = []
  const originalLog = console.log
  const originalError = console.error
  const startedAt = Date.now()

  try {
    console.log = (...values) => logMessages.push(values.join(' '))
    taskEvents.emit('task-created', {
      taskId: 'created-task',
      title: 'Async task',
      assignedUser: 'user-123'
    })
    assert.ok(Date.now() - startedAt < 500, 'event emission should not wait for notification processing')

    taskEvents.emit('task-deleted', {
      taskId: 'deleted-task',
      title: 'Removed task',
      assignedUser: 'user-123'
    })

    console.log = () => {
      throw new Error('simulated listener failure')
    }
    console.error = (...values) => errorMessages.push(values.join(' '))
    taskEvents.emit('task-created', {
      taskId: 'failed-task',
      title: 'Failure path',
      assignedUser: 'user-123'
    })
    console.log = (...values) => logMessages.push(values.join(' '))

    await new Promise(resolve => setTimeout(resolve, 2100))
  } finally {
    console.log = originalLog
    console.error = originalError
  }

  const createdMessages = logMessages.filter(message => message.includes('created-task'))
  assert.ok(logMessages.some(message => message.includes('task-created received at') && message.includes('Async task')))
  assert.ok(createdMessages.some(message => message.includes('handler started at')))
  assert.ok(createdMessages.some(message => message.includes('handler completed at')))
  assert.ok(logMessages.some(message => message.includes('task-deleted notification') && message.includes('deleted-task')))
  assert.ok(errorMessages.some(message => message.includes('task-created failed for failed-task')))
  assert.ok(Date.now() - startedAt >= 1900, 'notification completion should follow the simulated delay')
})
