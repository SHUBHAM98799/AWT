const assert = require('node:assert/strict')
const { after, afterEach, before, beforeEach, test } = require('node:test')
const { once } = require('node:events')
const jwt = require('jsonwebtoken')
const app = require('../server.cjs')
const { generateTaskDescription: callGemini } = require('../ai.cjs')

const testSecret = 'practical-13-test-secret'
process.env.JWT_SECRET = testSecret

let server
let baseUrl

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

beforeEach(() => {
  app.locals.aiRequestTimes.clear()
  app.locals.generateTaskDescription = async () => {
    throw new Error('No provider mock configured for this test')
  }
})

afterEach(() => {
  delete app.locals.generateTaskDescription
  app.locals.generateTaskDescription = require('../ai.cjs').generateTaskDescription
})

after(async () => {
  if (!server) return
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
})

function authHeaders(userId = 'test-user') {
  const token = jwt.sign({ id: userId }, testSecret)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

async function requestDescription(body, userId) {
  return fetch(`${baseUrl}/api/ai/generate-description`, {
    method: 'POST',
    headers: authHeaders(userId),
    body: JSON.stringify(body)
  })
}

test('AI description endpoint requires authentication', async () => {
  const response = await fetch(`${baseUrl}/api/ai/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Prepare database backup' })
  })

  assert.equal(response.status, 401)
})

test('AI description endpoint rejects missing, blank, and oversized titles', async () => {
  for (const body of [{}, { title: '  ' }, { title: 'x'.repeat(201) }]) {
    const response = await requestDescription(body)
    assert.equal(response.status, 400)
  }
})

test('AI description endpoint returns a structured mocked Gemini suggestion', async () => {
  let receivedTitle
  app.locals.generateTaskDescription = async title => {
    receivedTitle = title
    return 'Create and verify a secure database backup.'
  }

  const response = await requestDescription({ title: '  Prepare database backup  ' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    description: 'Create and verify a secure database backup.',
    fallback: false
  })
  assert.equal(receivedTitle, 'Prepare database backup')
})

test('provider errors return a safe fallback without exposing provider details', async () => {
  app.locals.generateTaskDescription = async () => {
    throw new Error('provider secret detail')
  }

  const response = await requestDescription({ title: 'Prepare database backup' })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    description: '',
    fallback: true,
    message: 'AI suggestions are temporarily unavailable. You can enter the description manually.'
  })
})

test('missing Gemini API key returns a fallback without calling the provider', async () => {
  let providerCalled = false
  app.locals.generateTaskDescription = title => callGemini(title, {
    apiKey: '',
    fetchImpl: async () => {
      providerCalled = true
      throw new Error('Fetch must not run without an API key')
    }
  })

  const response = await requestDescription({ title: 'Prepare database backup' })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).fallback, true)
  assert.equal(providerCalled, false)
})

test('Gemini provider rejects network errors, timeouts, and malformed responses', async () => {
  await assert.rejects(
    callGemini('Prepare backup', {
      apiKey: 'test-only',
      fetchImpl: async (_url, options) => {
        assert.ok(options.signal instanceof AbortSignal)
        throw new Error('simulated network or timeout failure')
      }
    }),
    /simulated network or timeout failure/
  )

  await assert.rejects(
    callGemini('Prepare backup', {
      apiKey: 'test-only',
      timeoutMs: 5,
      fetchImpl: (_url, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      })
    }),
    { name: 'TimeoutError' }
  )

  await assert.rejects(
    callGemini('Prepare backup', {
      apiKey: 'test-only',
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ candidates: [] })
      })
    }),
    /no task description/
  )

  await assert.rejects(
    callGemini('Prepare backup', {
      apiKey: 'test-only',
      fetchImpl: async () => ({ ok: false, status: 429 })
    }),
    /status 429/
  )
})

test('Gemini provider parses its mocked REST response and sends the key only in a header', async () => {
  let requestUrl
  let requestOptions
  const description = await callGemini('Prepare database backup', {
    apiKey: 'test-only-key',
    fetchImpl: async (url, options) => {
      requestUrl = url
      requestOptions = options
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Create and verify a database backup.' }]
            }
          }]
        })
      }
    }
  })

  assert.match(requestUrl, /generativelanguage\.googleapis\.com/)
  assert.equal(requestOptions.headers['x-goog-api-key'], 'test-only-key')
  assert.equal(requestUrl.includes('test-only-key'), false)
  assert.equal(description, 'Create and verify a database backup.')
})

test('AI endpoint rate-limits the same authenticated user and task title', async () => {
  let calls = 0
  app.locals.generateTaskDescription = async () => {
    calls++
    return 'Prepare the requested work.'
  }

  const first = await requestDescription({ title: 'Prepare database backup' })
  assert.equal(first.status, 200)

  const repeated = await requestDescription({ title: ' prepare database backup ' })
  assert.equal(repeated.status, 429)
  assert.equal(repeated.headers.get('retry-after'), '60')
  assert.equal((await repeated.json()).fallback, true)
  assert.equal(calls, 1)

  const differentTitle = await requestDescription({ title: 'Review backup logs' })
  assert.equal(differentTitle.status, 200)
  assert.equal(calls, 2)

  const differentUser = await requestDescription({ title: 'Prepare database backup' }, 'another-user')
  assert.equal(differentUser.status, 200)
  assert.equal(calls, 3)
})

test('task API rejects oversized descriptions before database access', async () => {
  const response = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title: 'Review backup', description: 'x'.repeat(2001) })
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'Task description must be 2000 characters or fewer'
  })
})

test('malformed JSON receives a client error instead of crashing Express', async () => {
  const response = await fetch(`${baseUrl}/api/ai/generate-description`, {
    method: 'POST',
    headers: {
      Authorization: authHeaders().Authorization,
      'Content-Type': 'application/json'
    },
    body: '{"title":'
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Invalid JSON request body' })
})
