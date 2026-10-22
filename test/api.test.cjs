const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const { once } = require('node:events')
const app = require('../server.cjs')

let server
let baseUrl

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (!server) return
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
})

test('GET /status returns the server health response', async () => {
  const response = await fetch(`${baseUrl}/status`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'UP',
    message: 'Express CRUD server is running.'
  })
})

test('POST /register rejects missing credentials before database access', async () => {
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '   ', password: 'test-password' })
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Email is required' })
})

test('GET /tasks requires authentication', async () => {
  const response = await fetch(`${baseUrl}/tasks`)

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'Authentication required' })
})
