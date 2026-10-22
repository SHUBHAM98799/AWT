const EventEmitter = require('node:events')

class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents()
