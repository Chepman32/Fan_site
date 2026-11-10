const { createHash, createHmac, timingSafeEqual } = require('node:crypto')

const ORDER_TTL_MS = 30 * 60_000
const CHECKOUT_LEASE_MS = 5 * 60_000
const MAX_CART_ITEMS = 20
const hash = (value) => createHash('sha256').update(String(value)).digest('hex')

function fail(status, message) { throw Object.assign(new Error(message), { status }) }

function equalSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function validTelegramId(value) { return Number.isSafeInteger(value) && value > 0 }
function orderIdFromPayload(value) { return /^stars:([a-f0-9]{32})$/.exec(value || '')?.[1] || '' }

function publicOrder(order, now) {
  return {
    id: order.id, currency: 'XTR', totalStars: order.totalStars,
    status: order.status === 'pending' && order.expiresAt <= now ? 'expired' : order.status,
    createdAt: order.createdAt, expiresAt: order.expiresAt, paidAt: order.paidAt || null,
    items: order.items.map(({ productId, title, priceStars }) => ({ productId, title, priceStars })),
  }
}

function createTelegramClient(config, fetchImpl = fetch) {
  return async (method, body) => {
    // Never log this URL: Telegram places the bot credential in its path.
    const testPath = config.testMode ? '/test' : ''
    let response
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${config.botToken}${testPath}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(method === 'answerPreCheckoutQuery' ? 2000 : 7000),
      })
    } catch { fail(502, 'Telegram is temporarily unavailable. Please try again.') }
    const result = await response.json().catch(() => ({}))
    if (!response.ok || !result.ok) {
      const error = Object.assign(new Error('Telegram could not complete this request.'), { status: 502 })
      error.alreadyRefunded = /CHARGE_ALREADY_REFUNDED/.test(result.description || '')
      throw error
    }
    return result.result
  }
}

function createStarsService({ db, catalog, config, telegram = createTelegramClient(config), now = Date.now, preCheckoutTimeoutMs = 6000 }) {
  const orders = db.collection('shopStarsOrders')
  const charges = db.collection('shopStarsCharges')
  const accountRef = (uid) => db.collection('shopStarsAccounts').doc(hash(uid))
  const ready = () => config.enabled === true && /^[A-Za-z0-9_]{5,32}$/.test(config.botUsername || '')
    && Boolean(config.botToken && config.webhookSecret)

  function publicConfig() {
    return {
      enabled: ready(), botUsername: config.botUsername || '',
      testMode: Boolean(config.testMode),
      prices: Object.fromEntries(Object.entries(catalog).map(([id, product]) => [id, product.priceStars])),
    }
  }

  function handoff(order) {
    return createHmac('sha256', config.botToken).update(`${order.ownerUid}:${order.id}`).digest('base64url').slice(0, 22)
  }

  function checkoutUrl(order) {
    return `https://t.me/${config.botUsername}?start=s_${order.id}_${handoff(order)}`
  }

  async function createOrder(uid, body) {
    if (!ready()) fail(503, 'Telegram Stars checkout is not available yet.')
    if (typeof uid !== 'string' || !uid) fail(401, 'Sign in to pay with Stars.')
    const { productIds, requestId } = body
    if (!Array.isArray(productIds) || !productIds.length || productIds.length > MAX_CART_ITEMS
      || new Set(productIds).size !== productIds.length || !/^[A-Za-z0-9-]{16,80}$/.test(requestId || '')) {
      fail(400, 'Choose 1–20 different products and try again.')
    }
    const items = productIds.map((productId) => {
      const product = typeof productId === 'string' && Object.hasOwn(catalog, productId) ? catalog[productId] : null
      if (!product || !Number.isSafeInteger(product.priceStars) || product.priceStars < 1 || !product.downloadUrl) {
        fail(400, 'One of these products is not available for Stars.')
      }
      return { productId, title: product.title, priceStars: product.priceStars,
        downloadUrl: product.downloadUrl, downloadFileName: product.downloadFileName }
    }).sort((a, b) => a.productId.localeCompare(b.productId))
    const totalStars = items.reduce((total, item) => total + item.priceStars, 0)
    if (!Number.isSafeInteger(totalStars) || totalStars > 100_000) fail(400, 'This cart exceeds the Stars checkout limit.')
    const timestamp = now()
    const id = hash(`${uid}:${requestId}`).slice(0, 32)
    const reference = orders.doc(id)
    const rateRef = db.collection('shopStarsRateLimits').doc(hash(uid))
    const candidate = { id, ownerUid: uid, items, totalStars, status: 'pending',
      createdAt: timestamp, expiresAt: timestamp + ORDER_TTL_MS }
    candidate.handoffHash = hash(handoff(candidate))
    const order = await db.runTransaction(async (tx) => {
      const [existing, rate, account] = await Promise.all([tx.get(reference), tx.get(rateRef), tx.get(accountRef(uid))])
      if (account.data()?.deleting) fail(409, 'This account is being deleted.')
      if (existing.exists) {
        const saved = existing.data()
        if (saved.items.map((item) => item.productId).join() !== items.map((item) => item.productId).join()) {
          fail(409, 'Start a new checkout after changing the cart.')
        }
        return saved
      }
      const limit = rate.data() || {}
      const withinWindow = timestamp - (limit.windowStart || 0) < 10 * 60_000
      const count = withinWindow ? limit.count || 0 : 0
      if (count >= 10) fail(429, 'Too many checkouts. Please wait 10 minutes.')
      tx.set(rateRef, { windowStart: withinWindow ? limit.windowStart : timestamp, count: count + 1 })
      tx.set(reference, candidate)
      return candidate
    })
    return { ...publicOrder(order, now()), checkoutUrl: checkoutUrl(order) }
  }

  async function ownedOrder(uid, id) {
    if (!/^[a-f0-9]{32}$/.test(id || '')) fail(404, 'Order not found.')
    const snap = await orders.doc(id).get()
    if (!snap.exists || snap.data().ownerUid !== uid) fail(404, 'Order not found.')
    return snap.data()
  }

  function viewOrder(order) {
    const view = publicOrder(order, now())
    if (view.status === 'pending' && ready()) view.checkoutUrl = checkoutUrl(order)
    return view
  }

  async function listOrders(uid, cursor) {
    let query = orders.where('ownerUid', '==', uid).orderBy('createdAt', 'desc').orderBy('__name__', 'desc')
    if (cursor) {
      const after = await ownedOrder(uid, cursor)
      query = query.startAfter(after.createdAt, after.id)
    }
    const snapshot = await query.limit(21).get()
    const page = snapshot.docs.slice(0, 20).map((doc) => viewOrder(doc.data()))
    return { orders: page, nextCursor: snapshot.docs.length > 20 ? page.at(-1).id : null }
  }

  async function download(uid, id, productId) {
    const order = await ownedOrder(uid, id)
    if (order.status !== 'paid') fail(409, 'This order has no active download access.')
    const item = order.items.find((entry) => entry.productId === productId)
    if (!item) fail(404, 'Product not found in this order.')
    return { downloadUrl: item.downloadUrl, fileName: item.downloadFileName }
  }

  async function sendText(chatId, text, url) {
    return telegram('sendMessage', { chat_id: chatId, text, ...(url ? {
      reply_markup: { inline_keyboard: [[{ text: 'Open my purchases', url }]] },
    } : {}) })
  }

  async function startInvoice(message) {
    const match = /^\/start(?:@[A-Za-z0-9_]+)?\s+s_([a-f0-9]{32})_([A-Za-z0-9_-]{22})$/.exec(message.text || '')
    if (!match) return sendText(message.chat.id, `Visit ${config.siteOrigin}/shop to choose a product. For payment help, use /paysupport.`)
    if (!ready()) return sendText(message.chat.id, 'Stars checkout is temporarily unavailable. Please return to the shop.')
    let order
    try {
      order = await db.runTransaction(async (tx) => {
        const reference = orders.doc(match[1])
        const snap = await tx.get(reference)
        const data = snap.data()
        if (!data || data.status !== 'pending' || data.expiresAt <= now()
          || !equalSecret(data.handoffHash, hash(match[2]))) fail(409, 'This checkout has expired. Start a new checkout on the website.')
        const account = await tx.get(accountRef(data.ownerUid))
        if (account.data()?.deleting) fail(409, 'This account is being deleted.')
        if (data.payerId && data.payerId !== message.from.id) fail(409, 'This checkout is already linked to another Telegram account.')
        tx.set(reference, { payerId: message.from.id }, { merge: true })
        return data
      })
    } catch (error) {
      if (error.status !== 409) throw error
      return sendText(message.chat.id, error.message)
    }
    return telegram('sendInvoice', {
      chat_id: message.chat.id, title: 'Leonida Loot shop',
      description: `${order.items.map((item) => item.title).join(', ').slice(0, 170)}. Downloads go to the website account that started checkout.`.slice(0, 255),
      payload: `stars:${order.id}`, provider_token: '', currency: 'XTR',
      prices: [{ label: 'Shop order', amount: order.totalStars }],
      start_parameter: `s_${order.id}_${match[2]}`,
    })
  }

  function matchesPayment(order, payment, payerId) {
    return order && order.payerId === payerId && payment.currency === 'XTR'
      && payment.total_amount === order.totalStars && orderIdFromPayload(payment.invoice_payload) === order.id
  }

  async function preCheckout(query) {
    let accepted = false
    let deadline
    const id = orderIdFromPayload(query.invoice_payload)
    if (ready() && id && validTelegramId(query.from?.id)) {
      try {
        accepted = await Promise.race([db.runTransaction(async (tx) => {
          const reference = orders.doc(id)
          const snap = await tx.get(reference)
          const order = snap.data()
          if (!matchesPayment(order, query, query.from.id) || order.status !== 'pending' || order.expiresAt <= now()) return false
          const account = await tx.get(accountRef(order.ownerUid))
          if (account.data()?.deleting) return false
          if (order.preCheckoutId && order.preCheckoutId !== query.id && order.checkoutLeaseUntil > now()) return false
          tx.set(reference, { preCheckoutId: query.id, approvedAt: now(), checkoutLeaseUntil: now() + CHECKOUT_LEASE_MS }, { merge: true })
          return true
        }), new Promise((resolve) => { deadline = setTimeout(() => resolve(false), preCheckoutTimeoutMs) })])
      } catch { accepted = false }
      finally { clearTimeout(deadline) }
    }
    await telegram('answerPreCheckoutQuery', { pre_checkout_query_id: query.id, ok: accepted,
      ...(!accepted ? { error_message: 'This checkout is unavailable or expired. Please start a new checkout on leonidaloot.com.' } : {}) })
  }

  async function recordPayment(payment, payerId, refunded = false) {
    const chargeId = payment.telegram_payment_charge_id
    if (typeof chargeId !== 'string' || !chargeId || chargeId.length > 512) fail(400, 'Invalid Telegram payment reference.')
    const id = orderIdFromPayload(payment.invoice_payload)
    const chargeRef = charges.doc(hash(chargeId))
    return db.runTransaction(async (tx) => {
      const [snap, previousCharge] = await Promise.all([
        id ? tx.get(orders.doc(id)) : Promise.resolve({ data: () => null }), tx.get(chargeRef),
      ])
      const order = snap.data()
      const known = previousCharge.data()
      if (!matchesPayment(order, payment, payerId) || !order.approvedAt
        || (known && known.orderId !== id) || (order.chargeId && order.chargeId !== chargeId)) {
        tx.set(db.collection('shopStarsReview').doc(hash(`${chargeId}:${id}:${refunded}`)), {
          orderId: id || null, chargeId, payerId, currency: String(payment.currency || '').slice(0, 10),
          totalAmount: Number.isSafeInteger(payment.total_amount) ? payment.total_amount : null,
          refunded, receivedAt: now(), reason: 'payment_mismatch',
        })
        return { status: 'review' }
      }
      if (order.status === 'refunded' || (order.status === 'refund_pending' && !refunded)
        || (order.status === 'paid' && !refunded)) return { status: order.status,
        needsRefund: !order.ownerUid && order.status === 'refund_pending', id }
      const status = refunded ? 'refunded' : order.ownerUid ? 'paid' : 'refund_pending'
      tx.set(chargeRef, { orderId: id, chargeId, payerId, totalStars: order.totalStars, status, updatedAt: now() })
      tx.set(orders.doc(id), { status, chargeId, ...(refunded ? { refundedAt: now() } : { paidAt: now() }) }, { merge: true })
      return { status, notify: !refunded && Boolean(order.ownerUid), needsRefund: status === 'refund_pending', id }
    })
  }

  async function refund(id) {
    if (!/^[a-f0-9]{32}$/.test(id || '')) fail(404, 'Order not found.')
    const reference = orders.doc(id)
    const order = await db.runTransaction(async (tx) => {
      const snap = await tx.get(reference)
      const data = snap.data()
      if (!data) fail(404, 'Order not found.')
      if (data.status === 'refunded') return data
      if (!['paid', 'refund_pending'].includes(data.status)) fail(409, 'Only paid orders can be refunded.')
      tx.set(reference, { status: 'refund_pending' }, { merge: true })
      return data
    })
    if (order.status === 'refunded') return { status: 'refunded' }
    try {
      await telegram('refundStarPayment', { user_id: order.payerId, telegram_payment_charge_id: order.chargeId })
    } catch (error) { if (!error.alreadyRefunded) throw error }
    await recordPayment({ currency: 'XTR', total_amount: order.totalStars, invoice_payload: `stars:${id}`,
      telegram_payment_charge_id: order.chargeId }, order.payerId, true)
    return { status: 'refunded' }
  }

  async function reconcile(offset = 0) {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) fail(400, 'Invalid transaction offset.')
    const result = await telegram('getStarTransactions', { offset, limit: 100 })
    if (!Array.isArray(result?.transactions)) fail(502, 'Telegram returned an invalid transaction list.')
    let processed = 0
    let review = 0
    for (const transaction of result.transactions) {
      const partner = transaction.source || transaction.receiver
      if (partner?.type !== 'user' || partner.transaction_type !== 'invoice_payment'
        || !validTelegramId(partner.user?.id) || transaction.nanostar_amount) continue
      const known = !transaction.source ? (await charges.doc(hash(transaction.id)).get()).data() : null
      const payload = partner.invoice_payload || (known ? `stars:${known.orderId}` : '')
      if (!orderIdFromPayload(payload)) continue
      const restored = await recordPayment({ currency: 'XTR', total_amount: Math.abs(transaction.amount),
        invoice_payload: payload, telegram_payment_charge_id: transaction.id }, partner.user.id, Boolean(transaction.receiver))
      if (restored.needsRefund) await refund(restored.id)
      if (restored.status === 'review') review++
      processed++
    }
    return { processed, review, nextOffset: result.transactions.length === 100 ? offset + 100 : null }
  }

  async function paymentSupport(message) {
    const details = /^\/paysupport(?:@[A-Za-z0-9_]+)?\s+([a-f0-9]{32})\s+([\s\S]{3,2000})$/.exec(message.text || '')
    if (!details) return sendText(message.chat.id,
      `Payment support: ${config.supportUrl}\nSend /paysupport ORDER_NUMBER followed by a description of the problem. Your order number is shown on the website. Leonida Loot handles shop support; Telegram support cannot resolve these purchases.`)
    const order = (await orders.doc(details[1]).get()).data()
    if (!order || order.payerId !== message.from.id) return sendText(message.chat.id, 'This order is not linked to your Telegram account. Check the order number on the website.')
    const id = hash(`${message.from.id}:${message.message_id}:${details[1]}`)
    const reference = db.collection('shopStarsSupport').doc(id)
    await db.runTransaction(async (tx) => {
      const previous = await tx.get(reference)
      if (!previous.exists) tx.set(reference, { id, orderId: details[1], payerId: message.from.id,
        message: details[2], status: 'open', createdAt: now() })
    })
    return sendText(message.chat.id, `Your payment support request is saved. Reference: ${id.slice(0, 12)}. The shop team can reply here.`)
  }

  async function listSupport() {
    const snapshot = await db.collection('shopStarsSupport').orderBy('createdAt', 'desc').limit(50).get()
    return { tickets: snapshot.docs.map((doc) => doc.data()) }
  }

  async function replyToSupport(id, text, operatorUid) {
    if (!/^[a-f0-9]{64}$/.test(id || '')) fail(404, 'Support request not found.')
    if (typeof text !== 'string' || text.trim().length < 3 || text.length > 2000) fail(400, 'Reply must contain 3–2000 characters.')
    const reference = db.collection('shopStarsSupport').doc(id)
    const ticket = (await reference.get()).data()
    if (!ticket) fail(404, 'Support request not found.')
    if (ticket.status === 'replied') return { status: 'replied' }
    await sendText(ticket.payerId, `Leonida Loot support · order ${ticket.orderId}\n${text.trim()}`)
    await reference.set({ status: 'replied', reply: text.trim(), operatorUid, repliedAt: now() }, { merge: true })
    return { status: 'replied' }
  }

  async function handleUpdate(update) {
    if (update.pre_checkout_query) { await preCheckout(update.pre_checkout_query); return }
    const message = update.message
    if (!message || message.chat?.type !== 'private' || !validTelegramId(message.chat.id)) return
    // Refund service messages can be sent by the bot. The verified private chat
    // and stored charge/order establish the payer independently of Message.from.
    if (message.refunded_payment) return recordPayment(message.refunded_payment, message.chat.id, true)
    if (!validTelegramId(message.from?.id)
      || message.chat.id !== message.from.id) return
    if (message.successful_payment) {
      const result = await recordPayment(message.successful_payment, message.from.id)
      if (result.needsRefund) await refund(result.id)
      if (result.notify) {
        // The order is committed before notification. Telegram message delivery is best-effort.
        await sendText(message.chat.id, `Payment confirmed. Order ${result.id}. Your downloads are in your website purchases.`,
          `${config.siteOrigin}/profile#stars-orders`).catch(() => {})
      }
      return result
    }
    if (/^\/paysupport(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(message.text || '')) {
      return paymentSupport(message)
    }
    if (/^\/start(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(message.text || '')) return startInvoice(message)
  }

  return { publicConfig, createOrder, getOrder: async (uid, id) => viewOrder(await ownedOrder(uid, id)), listOrders, download, handleUpdate, refund,
    reconcile, listSupport, replyToSupport }
}

function jsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body)) return req.body
  try {
    const data = JSON.parse(String(req.body || req.rawBody || '{}'))
    if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Request body must be a JSON object.')
    return data
  } catch { fail(400, 'Request body must be a JSON object.') }
}

function createStarsHandlers({ service, config, authenticate, logger }) {
  const report = (res, error) => {
    const status = error.status || (String(error.code).startsWith('auth/') ? 401 : 500)
    // Do not log request bodies, provider errors, credential URLs, or payer identifiers.
    if (status >= 500) logger.error('Stars request failed', { status })
    if (status === 429) res.set('Retry-After', '600')
    res.status(status).json({ error: status >= 500 && status !== 503 ? 'Payment services are temporarily unavailable. Please try again.' : error.message })
  }
  const api = async (req, res) => {
    res.set('Cache-Control', 'private, no-store')
    const origin = req.get('origin')
    const allowedOrigins = new Set([config.siteOrigin, 'https://www.leonidaloot.com', 'https://gta-vi-fan-site.web.app', 'https://gta-vi-fan-site.firebaseapp.com'])
    if (origin && allowedOrigins.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Vary', 'Origin')
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    }
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (!['GET', 'POST'].includes(req.method)) { res.status(405).json({ error: 'Use GET or POST.' }); return }
    try {
      const url = new URL(req.originalUrl || req.url, 'https://local.invalid')
      const path = url.pathname.replace(/^\/api\/shop\/stars(?=\/|$)/, '').replace(/\/$/, '')
      if (path === '/config' && req.method === 'GET') { res.json(service.publicConfig()); return }
      const user = await authenticate(req)
      if (path === '/reconcile' || path === '/support' || path.startsWith('/support/')) {
        if (user.admin !== true) fail(403, 'Administrator access is required.')
        if (path === '/reconcile' && req.method === 'POST') { res.json(await service.reconcile(jsonBody(req).offset)); return }
        if (path === '/support' && req.method === 'GET') { res.json(await service.listSupport()); return }
        const ticket = /^\/support\/([a-f0-9]{64})\/reply$/.exec(path)
        if (ticket && req.method === 'POST') { res.json(await service.replyToSupport(ticket[1], jsonBody(req).text, user.uid)); return }
        fail(405, 'Unsupported operator operation.')
      }
      if (path === '/orders' && req.method === 'POST') {
        const order = await service.createOrder(user.uid, jsonBody(req))
        res.set('Location', `/api/shop/stars/orders/${order.id}`)
        res.status(201).json(order); return
      }
      if (path === '/orders' && req.method === 'GET') {
        res.json(await service.listOrders(user.uid, url.searchParams.get('after'))); return
      }
      const route = /^\/orders\/([^/]+)(?:\/(download|refund))?$/.exec(path)
      if (!route) fail(404, 'Payment route not found.')
      const [, id, action] = route
      if (req.method === 'GET' && !action) { res.json(await service.getOrder(user.uid, id)); return }
      if (req.method === 'POST' && action === 'download') {
        res.json(await service.download(user.uid, id, jsonBody(req).productId)); return
      }
      if (req.method === 'POST' && action === 'refund') {
        if (user.admin !== true) fail(403, 'Administrator access is required.')
        res.json(await service.refund(id)); return
      }
      fail(405, 'Unsupported order operation.')
    } catch (error) { report(res, error) }
  }
  const webhook = async (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (req.method !== 'POST') { res.status(405).send('Use POST.'); return }
    if (!equalSecret(req.get('x-telegram-bot-api-secret-token'), config.webhookSecret)) {
      res.status(403).send('Forbidden'); return
    }
    try {
      const result = await service.handleUpdate(jsonBody(req))
      if (result?.status === 'review') logger.warn('Stars payment needs review')
      res.json({ ok: true })
    } catch (error) { report(res, error) }
  }
  return { api, webhook }
}

module.exports = { createStarsService, createStarsHandlers, createTelegramClient, equalSecret, hash }
