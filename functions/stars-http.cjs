const http = require('node:http')

const MAX_BODY_BYTES = 64 * 1024

function createStarsHttpHandler(handlers, logger = console) {
  return async (req, res) => {
    res.set = (name, value) => { res.setHeader(name, value); return res }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)) }
    res.send = (body) => res.end(body)
    req.get = (name) => req.headers[name.toLowerCase()]
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    try {
      const path = new URL(req.url, 'http://internal.invalid').pathname
      if (path === '/health' && req.method === 'GET') { res.json({ ok: true }); return }
      const handler = path === '/api/telegram/stars/webhook' ? handlers.webhook
        : /^\/api\/shop\/stars(?:\/|$)/.test(path) ? handlers.api : null
      if (!handler) { res.status(404).json({ error: 'Not found.' }); return }
      // Preflight is handled without parsing a body or invoking Firebase Auth.
      if (req.method !== 'OPTIONS') {
        let size = 0
        const chunks = []
        for await (const chunk of req) {
          const bytes = Buffer.from(chunk)
          size += bytes.length
          if (size <= MAX_BODY_BYTES) chunks.push(bytes)
        }
        if (size > MAX_BODY_BYTES) { res.status(413).json({ error: 'Request body is too large.' }); return }
        const body = Buffer.concat(chunks).toString('utf8')
        if (body && req.get('content-type') && !/^application\/json(?:;|$)/i.test(req.get('content-type'))) {
          res.status(415).json({ error: 'Use application/json.' }); return
        }
        try { req.body = body ? JSON.parse(body) : {} }
        catch { res.status(400).json({ error: 'Request body must be valid JSON.' }); return }
      }
      await handler(req, res)
    } catch {
      logger.error('Stars HTTP request failed')
      if (!res.writableEnded) res.status(500).json({ error: 'Payment services are temporarily unavailable.' })
    }
  }
}

function createStarsServer(handlers, logger) {
  const server = http.createServer(createStarsHttpHandler(handlers, logger))
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  return server
}

module.exports = { createStarsHttpHandler, createStarsServer }
