const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createStarsService, createStarsHandlers, createTelegramClient, hash } = require('../shop-stars.cjs')
const memoryDb = require('./memory-firestore.cjs')

const catalog = {
  overlay: { title: 'Ocean View Kit', priceStars: 260, downloadUrl: 'https://drive.google.com/file/d/test/view', downloadFileName: 'overlay.png' },
  emotes: { title: 'Emote Pack', priceStars: 1600, downloadUrl: 'https://drive.google.com/file/d/emotes/view', downloadFileName: 'emotes.zip' },
}

function fixture(overrides = {}) {
  const db = memoryDb()
  const calls = []
  let now = 1_800_000_000_000
  const config = {
    enabled: true, botUsername: 'FSFESbot', botToken: '12345:test-token',
    webhookSecret: 'webhook-secret', siteOrigin: 'https://leonidaloot.com',
    supportUrl: 'https://leonidaloot.com/contact', ...overrides,
  }
  const telegram = async (method, body) => { calls.push({ method, body }); return { message_id: 1 } }
  const service = createStarsService({ db, catalog, config, telegram, now: () => now })
  return { db, config, calls, service, advance: (ms) => { now += ms } }
}

const requestId = 'a02c6e33-32ec-49c5-80ce-cb6f65269d11'
const createOrder = (f, uid = 'buyer', extra = {}) => f.service.createOrder(uid, { productIds: ['overlay'], requestId, ...extra })

async function start(f, order, payer = 42) {
  const parameter = new URL(order.checkoutUrl).searchParams.get('start')
  return f.service.handleUpdate({ update_id: 1, message: {
    from: { id: payer }, chat: { id: payer, type: 'private' }, text: `/start ${parameter}`,
  } })
}

function payment(order, extra = {}) {
  return { currency: 'XTR', total_amount: 260, invoice_payload: `stars:${order.id}`, telegram_payment_charge_id: 'charge-1', ...extra }
}

async function approve(f, order, payer = 42, extra = {}) {
  return f.service.handleUpdate({ update_id: 2, pre_checkout_query: {
    id: 'query-1', from: { id: payer }, currency: 'XTR', total_amount: 260,
    invoice_payload: `stars:${order.id}`, ...extra,
  } })
}

async function pay(f, order, extra = {}, payer = 42) {
  return f.service.handleUpdate({ update_id: 3, message: {
    chat: { id: payer, type: 'private' }, from: { id: payer }, successful_payment: payment(order, extra),
  } })
}

test('server fixes price, binds owner, and returns a secret-free view', async () => {
  const f = fixture()
  const order = await createOrder(f, 'buyer', { amount: 1, ownerUid: 'victim' })
  assert.equal(order.totalStars, 260)
  assert.match(order.checkoutUrl, /^https:\/\/t\.me\/FSFESbot\?start=/)
  assert.equal(order.items[0].productId, 'overlay')
  assert.equal(order.items[0].downloadUrl, undefined)
  assert.equal(order.payerId, undefined)
  assert.equal(order.handoffHash, undefined)
  await assert.rejects(f.service.getOrder('victim', order.id), { status: 404 })
})

test('order creation is idempotent and rejects request key reuse for another cart', async () => {
  const f = fixture()
  const [a, b] = await Promise.all([createOrder(f), createOrder(f)])
  assert.equal(a.id, b.id)
  assert.equal(a.checkoutUrl, b.checkoutUrl)
  await assert.rejects(createOrder(f, 'buyer', { productIds: ['emotes'] }), { status: 409 })
})

test('rejects empty, unknown, duplicate, oversized carts and invalid request IDs', async () => {
  for (const body of [
    { productIds: [] }, { productIds: ['missing'] }, { productIds: ['overlay', 'overlay'] },
    { productIds: Array(21).fill('overlay') }, { requestId: '../bad' },
  ]) await assert.rejects(createOrder(fixture(), 'buyer', body), { status: 400 })
})

test('disabled or unconfigured service never accepts orders', async () => {
  for (const config of [{ enabled: false }, { botToken: '' }, { webhookSecret: '' }, { botUsername: '' }]) {
    const f = fixture(config)
    assert.equal(f.service.publicConfig().enabled, false)
    await assert.rejects(createOrder(f), { status: 503 })
  }
})

test('rate limits new invoices but permits idempotent retries', async () => {
  const f = fixture()
  const first = await createOrder(f)
  for (let i = 0; i < 9; i++) await createOrder(f, 'buyer', { requestId: `request-${String(i).padStart(16, '0')}` })
  await assert.rejects(createOrder(f, 'buyer', { requestId: 'request-over-limit-000' }), { status: 429 })
  assert.equal((await createOrder(f)).id, first.id)
})

test('a verified private bot handoff creates an XTR invoice and binds the payer', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  const call = f.calls.find((x) => x.method === 'sendInvoice')
  assert.equal(call.body.currency, 'XTR')
  assert.equal(call.body.prices.length, 1)
  assert.equal(call.body.prices[0].amount, 260)
  assert.equal(call.body.chat_id, 42)
  await start(f, order, 99)
  assert.equal(f.calls.filter((x) => x.method === 'sendInvoice').length, 1)
})

test('tampered handoff or group messages cannot bind a payer', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await f.service.handleUpdate({ message: { from: { id: 99 }, chat: { id: 99, type: 'private' }, text: '/start s_bad' } })
  await f.service.handleUpdate({ message: { from: { id: 99 }, chat: { id: -1, type: 'group' }, text: `/start ${new URL(order.checkoutUrl).searchParams.get('start')}` } })
  assert.equal(f.calls.filter((x) => x.method === 'sendInvoice').length, 0)
  await assert.rejects(f.service.download('buyer', order.id, 'overlay'), { status: 409 })
})

test('pre-checkout rejects wrong payer, amount, currency, unknown payload and expired orders', async () => {
  for (const [payer, extra] of [[99, {}], [42, { total_amount: 1 }], [42, { currency: 'USD' }], [42, { invoice_payload: 'bad' }]]) {
    const f = fixture()
    const order = await createOrder(f)
    await start(f, order)
    await approve(f, order, payer, extra)
    assert.equal(f.calls.find((x) => x.method === 'answerPreCheckoutQuery').body.ok, false)
  }
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  f.advance(31 * 60_000)
  await approve(f, order)
  assert.equal(f.calls.find((x) => x.method === 'answerPreCheckoutQuery').body.ok, false)
})

test('pre-checkout approval does not deliver and concurrent payment attempts are rejected', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  assert.equal(f.calls.find((x) => x.method === 'answerPreCheckoutQuery').body.ok, true)
  await assert.rejects(f.service.download('buyer', order.id, 'overlay'), { status: 409 })
  await approve(f, order, 42, { id: 'query-2' })
  assert.equal(f.calls.filter((x) => x.method === 'answerPreCheckoutQuery').at(-1).body.ok, false)
})

test('only successful payment grants downloads, including delayed delivery and duplicate updates', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  f.advance(60 * 60_000)
  await Promise.all([pay(f, order), pay(f, order)])
  assert.equal((await f.service.getOrder('buyer', order.id)).status, 'paid')
  assert.equal((await f.service.download('buyer', order.id, 'overlay')).downloadUrl, catalog.overlay.downloadUrl)
  await assert.rejects(f.service.download('other', order.id, 'overlay'), { status: 404 })
  await assert.rejects(f.service.download('buyer', order.id, 'emotes'), { status: 404 })
})

test('invalid successful payments are recorded for review without granting downloads', async () => {
  for (const extra of [{ total_amount: 1 }, { currency: 'USD' }, { invoice_payload: 'unknown' }]) {
    const f = fixture()
    const order = await createOrder(f)
    await start(f, order)
    await approve(f, order)
    await pay(f, order, extra)
    assert.notEqual((await f.service.getOrder('buyer', order.id)).status, 'paid')
    assert.ok([...f.db.documents.keys()].some((key) => key.startsWith('shopStarsReview/')))
  }
})

test('unapproved payments, wrong payers and reused charges never grant another order', async () => {
  const f = fixture()
  const a = await createOrder(f)
  await start(f, a)
  await pay(f, a)
  assert.notEqual((await f.service.getOrder('buyer', a.id)).status, 'paid')
  await approve(f, a)
  await pay(f, a, {}, 99)
  assert.notEqual((await f.service.getOrder('buyer', a.id)).status, 'paid')
  await pay(f, a)
  const b = await createOrder(f, 'buyer', { requestId: 'second-order-request-000' })
  await start(f, b)
  await approve(f, b)
  await pay(f, b)
  assert.notEqual((await f.service.getOrder('buyer', b.id)).status, 'paid')
})

test('refunds revoke downloads and replayed successes do not restore access', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  await pay(f, order)
  await f.service.refund(order.id)
  assert.equal((await f.service.getOrder('buyer', order.id)).status, 'refunded')
  assert.equal(f.calls.find((x) => x.method === 'refundStarPayment').body.telegram_payment_charge_id, 'charge-1')
  await pay(f, order)
  await assert.rejects(f.service.download('buyer', order.id, 'overlay'), { status: 409 })
  await f.service.refund(order.id)
  assert.equal(f.calls.filter((x) => x.method === 'refundStarPayment').length, 1)
})

test('refund notifications revoke purchases even if delivered before success', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  await f.service.handleUpdate({ message: { from: { id: 12345, is_bot: true }, chat: { id: 42, type: 'private' }, refunded_payment: payment(order) } })
  await pay(f, order)
  assert.equal((await f.service.getOrder('buyer', order.id)).status, 'refunded')
})

test('payment support gives a working support URL', async () => {
  const f = fixture()
  await f.service.handleUpdate({ message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, text: '/paysupport' } })
  assert.match(f.calls[0].body.text, /https:\/\/leonidaloot.com\/contact/)
})

function response() {
  return { statusCode: 200, headers: {}, set(k, v) { this.headers[k] = v; return this }, status(n) { this.statusCode = n; return this }, json(v) { this.body = v; return this }, send(v) { this.body = v; return this } }
}
function request(method, url, body, headers = {}) {
  return { method, url, body, get: (name) => headers[name.toLowerCase()] }
}

test('HTTP: auth, malformed JSON, webhook forgery, method and route boundaries', async () => {
  const f = fixture()
  const handlers = createStarsHandlers({ service: f.service, config: f.config,
    authenticate: async (req) => { if (req.get('authorization') !== 'Bearer valid') throw Object.assign(new Error('Unauthorized'), { status: 401 }); return { uid: 'buyer' } },
    logger: { warn() {}, error() {} },
  })
  for (const [handler, req, expected] of [
    [handlers.api, request('POST', '/api/shop/stars/orders', {}), 401],
    [handlers.api, request('POST', '/api/shop/stars/orders', 'broken', { authorization: 'Bearer valid' }), 400],
    [handlers.api, request('DELETE', '/api/shop/stars/orders', {}, { authorization: 'Bearer valid' }), 405],
    [handlers.api, request('GET', '/api/shop/stars/missing', {}, { authorization: 'Bearer valid' }), 404],
    [handlers.webhook, request('POST', '/', {}), 403],
    [handlers.webhook, request('GET', '/', {}, { 'x-telegram-bot-api-secret-token': 'webhook-secret' }), 405],
  ]) { const res = response(); await handler(req, res); assert.equal(res.statusCode, expected) }
  const res = response()
  await handlers.api(request('GET', '/api/shop/stars/config'), res)
  assert.equal(res.body.enabled, true)
  assert.equal(JSON.stringify(res.body).includes('test-token'), false)
})

test('HTTP: a buyer cannot invoke refunds', async () => {
  const f = fixture()
  const handlers = createStarsHandlers({ service: f.service, config: f.config, authenticate: async () => ({ uid: 'buyer' }), logger: { error() {}, warn() {} } })
  const res = response()
  await handlers.api(request('POST', '/api/shop/stars/orders/abcd/refund', {}), res)
  assert.equal(res.statusCode, 403)
})

test('history is private and paginates deterministically', async () => {
  const f = fixture()
  for (let i = 0; i < 22; i++) {
    await createOrder(f, 'buyer', { requestId: `history-request-${String(i).padStart(16, '0')}` })
    f.advance(11 * 60_000)
  }
  await createOrder(f, 'other')
  const page = await f.service.listOrders('buyer')
  assert.equal(page.orders.length, 20)
  assert.ok(page.nextCursor)
  const rest = await f.service.listOrders('buyer', page.nextCursor)
  assert.equal(rest.orders.length, 2)
  assert.equal(rest.nextCursor, null)
  assert.equal(new Set([...page.orders, ...rest.orders].map((order) => order.id)).size, 22)
  await assert.rejects(f.service.listOrders('other', page.nextCursor), { status: 404 })
  assert.equal(JSON.stringify(page).includes('payerId'), false)
})

test('deleting accounts cannot create or approve orders', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await f.db.collection('shopStarsAccounts').doc(hash('buyer')).set({ deleting: true })
  await assert.rejects(createOrder(f), { status: 409 })
  await approve(f, order)
  assert.equal(f.calls.at(-1).body.ok, false)
  await start(f, order)
  assert.match(f.calls.at(-1).body.text, /deleted/)
})

test('a delayed payment for a deleted account is refunded automatically', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  await f.db.collection('shopStarsOrders').doc(order.id).set({ ownerUid: null }, { merge: true })
  await pay(f, order)
  assert.equal(f.calls.filter((call) => call.method === 'refundStarPayment').length, 1)
  assert.equal((await f.db.collection('shopStarsOrders').doc(order.id).get()).data().status, 'refunded')
})

test('pre-checkout fails closed on database errors and meets its application deadline', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  f.db.runTransaction = async () => { throw new Error('Database unavailable') }
  await approve(f, order)
  assert.equal(f.calls.at(-1).body.ok, false)
  f.db.runTransaction = () => new Promise(() => {})
  const service = createStarsService({ db: f.db, catalog, config: f.config, telegram: async (method, body) => f.calls.push({ method, body }), preCheckoutTimeoutMs: 5 })
  const before = Date.now()
  await service.handleUpdate({ pre_checkout_query: { id: 'slow', from: { id: 42 }, ...payment(order) } })
  assert.ok(Date.now() - before < 1000)
  assert.equal(f.calls.at(-1).body.ok, false)
})

test('refund failure leaves access suspended and a later retry can complete', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  await pay(f, order)
  const failing = createStarsService({ db: f.db, catalog, config: f.config, telegram: async () => { throw new Error('Provider unavailable') } })
  await assert.rejects(failing.refund(order.id))
  await assert.rejects(f.service.download('buyer', order.id, 'overlay'), { status: 409 })
  await f.service.refund(order.id)
  assert.equal((await f.service.getOrder('buyer', order.id)).status, 'refunded')
})

test('Telegram client selects test/live URLs and sanitizes provider/network errors', async () => {
  const config = { botToken: 'secret-token', testMode: true }
  const paths = []
  const client = createTelegramClient(config, async (url, options) => {
    paths.push(url)
    assert.equal(options.method, 'POST')
    return { ok: true, json: async () => ({ ok: true, result: true }) }
  })
  assert.equal(await client('answerPreCheckoutQuery', {}), true)
  assert.match(paths[0], /\/test\/answerPreCheckoutQuery$/)
  const network = createTelegramClient(config, async () => { throw new Error('https://api.telegram.org/botsecret-token') })
  await assert.rejects(network('sendInvoice', {}), (error) => error.status === 502 && !error.message.includes('secret-token'))
  const provider = createTelegramClient(config, async () => ({ ok: false, json: async () => ({ description: 'CHARGE_ALREADY_REFUNDED' }) }))
  await assert.rejects(provider('refundStarPayment', {}), (error) => error.alreadyRefunded)
  const invalid = createTelegramClient(config, async () => ({ ok: true, json: async () => { throw new Error() } }))
  await assert.rejects(invalid('sendInvoice', {}), { status: 502 })
})

test('HTTP: an authenticated order completes through verified webhook updates', async () => {
  const f = fixture()
  const handlers = createStarsHandlers({ service: f.service, config: f.config, authenticate: async () => ({ uid: 'buyer', admin: true }), logger: { error() {}, warn() {} } })
  const invoke = async (method, path, body, webhook = false) => {
    const res = response()
    await (webhook ? handlers.webhook : handlers.api)(request(method, path, body, { 'x-telegram-bot-api-secret-token': 'webhook-secret', origin: 'https://leonidaloot.com' }), res)
    return res
  }
  const created = await invoke('POST', '/api/shop/stars/orders', { requestId, productIds: ['overlay'] })
  assert.equal(created.statusCode, 201)
  const order = created.body
  assert.equal(created.headers.Location, `/api/shop/stars/orders/${order.id}`)
  await start(f, order)
  await invoke('POST', '/', { pre_checkout_query: { id: 'query-1', from: { id: 42 }, ...payment(order) } }, true)
  const confirmed = await invoke('POST', '/', { message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, successful_payment: payment(order) } }, true)
  assert.equal(confirmed.statusCode, 200)
  assert.equal((await invoke('GET', `/api/shop/stars/orders/${order.id}`)).body.status, 'paid')
  assert.equal((await invoke('GET', '/api/shop/stars/orders')).body.orders.length, 1)
  assert.equal((await invoke('POST', `/api/shop/stars/orders/${order.id}/download`, { productId: 'overlay' })).body.downloadUrl, catalog.overlay.downloadUrl)
  assert.equal((await invoke('POST', `/api/shop/stars/orders/${order.id}/refund`, {})).body.status, 'refunded')
  assert.equal((await invoke('OPTIONS', '/api/shop/stars/orders')).statusCode, 204)
})

test('HTTP: malformed updates, unsupported operations, and internal errors fail safely', async () => {
  const f = fixture()
  const handlers = createStarsHandlers({ service: f.service, config: f.config, authenticate: async () => ({ uid: 'buyer' }), logger: { error() {}, warn() {} } })
  for (const value of ['[]', 'null', 'broken']) {
    const res = response()
    await handlers.webhook(request('POST', '/', value, { 'x-telegram-bot-api-secret-token': 'webhook-secret' }), res)
    assert.equal(res.statusCode, 400)
  }
  const res = response()
  await handlers.api(request('POST', '/orders/123', {}), res)
  assert.equal(res.statusCode, 405)
  const failing = createStarsHandlers({ service: f.service, config: f.config, authenticate: async () => { throw new Error('sensitive internals') }, logger: { error() {} } })
  const error = response()
  await failing.api(request('GET', '/orders'), error)
  assert.equal(error.statusCode, 500)
  assert.equal(JSON.stringify(error.body).includes('sensitive'), false)
})

test('payment support records an owned order issue and accepts an operator reply', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await f.service.handleUpdate({ update_id: 5, message: { message_id: 5, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: `/paysupport ${order.id} My download does not open` } })
  const tickets = await f.service.listSupport()
  assert.equal(tickets.tickets.length, 1)
  assert.match(tickets.tickets[0].message, /download/)
  await f.service.replyToSupport(tickets.tickets[0].id, 'I have checked your order.', 'operator')
  assert.equal(f.calls.at(-1).body.chat_id, 42)
  assert.equal((await f.service.listSupport()).tickets[0].status, 'replied')
  await f.service.handleUpdate({ update_id: 6, message: { message_id: 6, from: { id: 99 }, chat: { id: 99, type: 'private' }, text: `/paysupport ${order.id} Other account` } })
  assert.equal((await f.service.listSupport()).tickets.length, 1)
})

test('operator reconciliation recovers a missed successful payment and later refund', async () => {
  const f = fixture()
  const order = await createOrder(f)
  await start(f, order)
  await approve(f, order)
  let transactions = [{ id: 'recovered-charge', amount: 260, source: { type: 'user', transaction_type: 'invoice_payment', user: { id: 42 }, invoice_payload: `stars:${order.id}` } }]
  const service = createStarsService({ db: f.db, catalog, config: f.config, telegram: async (method) => {
    assert.equal(method, 'getStarTransactions')
    return { transactions }
  } })
  assert.equal((await service.reconcile(0)).processed, 1)
  assert.equal((await service.getOrder('buyer', order.id)).status, 'paid')
  transactions = [{ id: 'recovered-charge', amount: -260, receiver: { type: 'user', transaction_type: 'invoice_payment', user: { id: 42 } } }]
  await service.reconcile(0)
  assert.equal((await service.getOrder('buyer', order.id)).status, 'refunded')
  await assert.rejects(service.reconcile(-1), { status: 400 })
})
