const admin = require('firebase-admin')
const { createStarsRuntime } = require('./generated/stars-runtime.cjs')
const { createStarsServer } = require('./generated/stars-http.cjs')
const catalog = require('./generated/shop-stars-catalog.json')

const port = Number(process.env.PORT || 8080)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port.')
const handlers = createStarsRuntime({ admin, catalog })
const server = createStarsServer(handlers)
server.listen(port, '0.0.0.0', () => console.log('Stars payment service is ready.'))
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
