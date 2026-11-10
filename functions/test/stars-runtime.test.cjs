const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Readable } = require('node:stream')
const { createStarsRuntime } = require('../stars-runtime.cjs')
const { createStarsHttpHandler } = require('../stars-http.cjs')
const memoryDb = require('./memory-firestore.cjs')

function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value },
    end(body) { this.body = body; this.writableEnded = true } }
}
function request(method, url, body = '', headers = {}) {
  return Object.assign(Readable.from(body ? [body] : []), { method, url, headers })
}

test('runtime in the billed project pins Auth and Firestore to the original site', async () => {
  const db = memoryDb()
  const calls = []
  const apps = []
  const admin = { apps,
    initializeApp(options, name) { const app = { options, name }; apps.push(app); return app },
    firestore(app) { calls.push(['db', app.options.projectId]); return db },
    auth(app) { return { verifyIdToken: async (token, revoked) => {
      calls.push(['auth', app.options.projectId, token, revoked]); return { uid: 'buyer' }
    } } },
  }
  const env = { GOOGLE_CLOUD_PROJECT: 'fan-site-496610', STARS_AUTH_PROJECT_ID: 'gta-vi-fan-site',
    STARS_DATA_PROJECT_ID: 'gta-vi-fan-site', TELEGRAM_STARS_ENABLED: 'false' }
  const runtime = createStarsRuntime({ admin, catalog: {}, env, logger: { error() {}, warn() {} } })
  const req = { method: 'GET', url: '/api/shop/stars/orders/00000000000000000000000000000000', get: (key) => key === 'authorization' ? 'Bearer website-token' : undefined }
  const res = { set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body } }
  await runtime.api(req, res)
  assert.ok(calls.some((call) => call[0] === 'db' && call[1] === 'gta-vi-fan-site'))
  assert.deepEqual(calls.find((call) => call[0] === 'auth'), ['auth', 'gta-vi-fan-site', 'website-token', true])
  createStarsRuntime({ admin, catalog: {}, env, logger: { error() {}, warn() {} } })
  assert.equal(apps.length, 1)
})

test('runtime requires the original website audience by default and rejects malformed project config', () => {
  const apps = []
  const admin = { apps, initializeApp(options, name) { const app = { options, name }; apps.push(app); return app }, firestore: () => memoryDb(), auth: () => ({}) }
  createStarsRuntime({ admin, catalog: {}, env: { GOOGLE_CLOUD_PROJECT: 'fan-site-496610' }, logger: {} })
  assert.equal(apps[0].options.projectId, 'gta-vi-fan-site')
  assert.throws(() => createStarsRuntime({ admin, catalog: {}, env: { STARS_AUTH_PROJECT_ID: '../wrong' } }), /project/i)
})

test('runtime distinguishes invalid sessions from Firebase outages without exposing provider details', async () => {
  const apps = []
  let code = 'auth/id-token-revoked'
  const admin = { apps, initializeApp(options, name) { const app = { options, name }; apps.push(app); return app },
    firestore: () => memoryDb(), auth: () => ({ verifyIdToken: async () => {
      throw Object.assign(new Error('private provider response'), { code })
    } }) }
  const runtime = createStarsRuntime({ admin, catalog: {}, env: {}, logger: { error() {} } })
  const handler = createStarsHttpHandler(runtime)
  for (const [firebaseCode, status, message] of [
    ['auth/id-token-revoked', 401, 'Sign in again to pay with Stars.'],
    ['auth/internal-error', 503, 'Sign-in verification is temporarily unavailable. Please try again.'],
  ]) {
    code = firebaseCode
    const res = response()
    await handler(request('GET', '/api/shop/stars/orders', '', { authorization: 'Bearer website-token' }), res)
    assert.equal(res.statusCode, status)
    assert.deepEqual(JSON.parse(res.body), { error: message })
  }
})

test('HTTP adapter routes API/webhook independently and never turns an unknown route into a webhook', async () => {
  const calls = []
  const handler = createStarsHttpHandler({
    api: async (req, res) => { calls.push(['api', req.body, req.get('authorization')]); res.status(201).json({ id: 'order' }) },
    webhook: async (req, res) => { calls.push(['webhook', req.body]); res.json({ ok: true }) },
  })
  const api = response()
  await handler(request('POST', '/api/shop/stars/orders', '{"productIds":["overlay"]}', { authorization: 'Bearer website' }), api)
  assert.equal(api.statusCode, 201)
  assert.deepEqual(calls[0], ['api', { productIds: ['overlay'] }, 'Bearer website'])
  const webhook = response()
  await handler(request('POST', '/api/telegram/stars/webhook', '{"update_id":1}'), webhook)
  assert.equal(calls[1][0], 'webhook')
  const unknown = response()
  await handler(request('POST', '/unknown', '{}'), unknown)
  assert.equal(unknown.statusCode, 404)
  assert.equal(calls.length, 2)
  const health = response()
  await handler(request('GET', '/health'), health)
  assert.deepEqual(JSON.parse(health.body), { ok: true })
})

test('HTTP adapter rejects invalid JSON, oversized input and non-JSON bodies', async () => {
  const handler = createStarsHttpHandler({ api: async () => assert.fail('should not execute'), webhook: async () => assert.fail('should not execute') })
  for (const [body, headers, expected] of [
    ['broken', { 'content-type': 'application/json' }, 400],
    ['x'.repeat(65 * 1024), { 'content-type': 'application/json' }, 413],
    ['{}', { 'content-type': 'text/plain' }, 415],
  ]) {
    const res = response()
    await handler(request('POST', '/api/shop/stars/orders', body, headers), res)
    assert.equal(res.statusCode, expected)
  }
})

test('browser endpoint resolver supports a remote Stars service without changing Firebase configuration', async () => {
  const { starsEndpoint } = await import('../../src/shop/starsEndpoint.js')
  assert.equal(starsEndpoint(), '/api/shop/stars')
  assert.equal(starsEndpoint('https://leonida-stars.example.run.app/api/shop/stars/'), 'https://leonida-stars.example.run.app/api/shop/stars')
  for (const value of ['http://untrusted.example/api', 'https://user:password@example.com/api', 'https://example.com/api?token=wrong', '//example.com/api']) {
    assert.throws(() => starsEndpoint(value), /endpoint/i)
  }
})
