import assert from 'node:assert/strict'
import process from 'node:process'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { createStarsService, createStarsHandlers } = require('../functions/shop-stars.cjs')
const { createStarsServer } = require('../functions/stars-http.cjs')
const memoryDb = require('../functions/test/memory-firestore.cjs')
const playwright = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright-core')

const config = { enabled: true, botUsername: 'FSFESbot', botToken: '123:local-test-only',
  webhookSecret: 'local-webhook-only', siteOrigin: 'https://leonidaloot.com', supportUrl: 'https://leonidaloot.com/contact' }
const db = memoryDb()
const calls = []
const service = createStarsService({ db, config, catalog: {
  overlay: { title: 'Ocean View Kit', priceStars: 260, downloadUrl: 'https://drive.google.com/file/d/local-test/view', downloadFileName: 'overlay.png' },
}, telegram: async (method, body) => { calls.push({ method, body }); return true } })
const handlers = createStarsHandlers({ service, config, logger: { error() {}, warn() {} }, authenticate: async (req) => {
  if (req.get('authorization') !== 'Bearer local-test-buyer') throw Object.assign(new Error('Sign in'), { status: 401 })
  return { uid: 'buyer' }
} })
const apiServer = createStarsServer(handlers)
await new Promise((resolve) => apiServer.listen(0, '127.0.0.1', resolve))
const apiOrigin = `http://127.0.0.1:${apiServer.address().port}`
assert.deepEqual(await fetch(`${apiOrigin}/health`).then((res) => res.json()), { ok: true })

const server = await createServer({
  server: { port: 0, host: '127.0.0.1', open: false, proxy: { '/api/shop/stars': apiOrigin } },
  plugins: [{
    name: 'isolated-stars-test', enforce: 'pre',
    resolveId(source) {
      if (/social\/SocialContext(?:\.jsx)?$/.test(source)) return '\0stars-test-social'
      if (/firebase\/firebaseClient(?:\.js)?$/.test(source)) return '\0stars-test-firebase'
    },
    load(id) {
      if (id === '\0stars-test-social') return `export function useSocial() { const guest = new URLSearchParams(location.search).has('guest'); return { currentUser: guest ? null : { id: 'buyer' }, isSignedIn: !guest, recordPurchase: async () => true }; }`
      if (id === '\0stars-test-firebase') return `export async function getFirebaseServices() { return { auth: { currentUser: new URLSearchParams(location.search).has('guest') ? null : { uid: 'buyer', getIdToken: async () => 'local-test-buyer' } } }; }`
    },
  }],
})
let browser
try {
  await server.listen()
  const port = server.httpServer.address().port
  const base = `http://127.0.0.1:${port}/scripts/fixtures/stars-checkout.html`
  browser = await playwright.chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  // Never contact Telegram, Firebase, Google Drive, or any other remote service.
  await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue() : route.abort())
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const starsTab = () => page.getByRole('tab', { name: 'Telegram Stars', exact: true })
  const checkout = () => page.getByRole('region', { name: 'Pay with Telegram Stars' })
  const waitForText = (locator, expected) => locator.filter({ hasText: expected }).waitFor()

  await page.goto(`${base}?guest=1`)
  await starsTab().click()
  await page.getByRole('button', { name: 'Sign in to pay with Stars', exact: true }).click()
  await waitForText(page.locator('#auth-result'), 'Sign-in opened')
  assert.equal([...db.documents.keys()].some((key) => key.startsWith('shopStarsOrders/')), false)

  await page.goto(base)
  await page.getByRole('tab', { name: 'USDT TRC20', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await starsTab().getAttribute('aria-selected'), 'true')
  await checkout().getByRole('button', { name: 'Continue in Telegram', exact: true }).click()
  const paymentLink = checkout().getByRole('link', { name: 'Open payment in Telegram', exact: true })
  await paymentLink.waitFor()
  const link = await paymentLink.getAttribute('href')
  const order = [...db.documents].find(([key]) => key.startsWith('shopStarsOrders/'))[1]
  assert.equal(order.totalStars, 260)
  assert.equal(await checkout().getByRole('button', { name: 'Download', exact: true }).count(), 0)

  await page.reload()
  await starsTab().click()
  await checkout().getByRole('link', { name: 'Open payment in Telegram', exact: true }).waitFor()
  assert.equal(await checkout().getByRole('link', { name: 'Open payment in Telegram', exact: true }).getAttribute('href'), link)
  const parameter = new URL(link).searchParams.get('start')
  await service.handleUpdate({ message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, text: `/start ${parameter}` } })
  await service.handleUpdate({ pre_checkout_query: { id: 'browser-checkout', from: { id: 42 },
    currency: 'XTR', total_amount: 260, invoice_payload: `stars:${order.id}` } })
  assert.equal(calls.find((call) => call.method === 'answerPreCheckoutQuery').body.ok, true)
  assert.equal(await checkout().getByRole('button', { name: 'Download', exact: true }).count(), 0)
  const paidUpdate = { message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, successful_payment: {
    currency: 'XTR', total_amount: 260, invoice_payload: `stars:${order.id}`, telegram_payment_charge_id: 'browser-charge',
  } } }
  await service.handleUpdate(paidUpdate)
  await service.handleUpdate(paidUpdate)
  await checkout().getByRole('button', { name: 'Check payment status', exact: true }).click()
  await checkout().getByRole('button', { name: 'Download', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Refresh purchases', exact: true }).click()
  await page.locator('#stars-orders').getByRole('button', { name: 'Download', exact: true }).waitFor()

  const [popup] = await Promise.all([
    context.waitForEvent('page'), checkout().getByRole('button', { name: 'Download', exact: true }).click(),
  ])
  await popup.waitForURL('https://drive.google.com/file/d/local-test/view').catch(() => {})
  await popup.close()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)

  await service.refund(order.id)
  await page.reload()
  await starsTab().click()
  await waitForText(checkout().getByRole('status'), 'Payment refunded')
  assert.equal(await checkout().getByRole('button', { name: 'Download', exact: true }).count(), 0)
  await waitForText(page.locator('#stars-orders'), 'Payment refunded')
  assert.equal(await page.locator('#stars-orders').getByRole('button', { name: 'Download', exact: true }).count(), 0)
  config.enabled = false
  await page.goto(`${base}?guest=1`)
  await starsTab().click()
  await page.goto(base)
  await page.evaluate(() => sessionStorage.clear())
  await page.reload()
  await starsTab().click()
  await waitForText(checkout(), 'Telegram Stars payments are not available yet.')
  assert.equal(errors.length, 0, errors.join('\n'))
  console.log('Browser checks passed: sign-in, keyboard tabs, fixed quote, recovery after reload, confirmed delivery, history, mobile fit, refunds, disabled configuration. No external services were called.')
} finally {
  await browser?.close()
  await server.close()
  await new Promise((resolve) => apiServer.close(resolve))
}
