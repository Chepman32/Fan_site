import assert from 'node:assert/strict'
import process from 'node:process'
import { createRequire } from 'node:module'
import { initializeApp, deleteApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, getDoc, setDoc, deleteDoc, doc, terminate } from 'firebase/firestore'

const require = createRequire(new URL('../functions/index.cjs', import.meta.url))
const admin = require('firebase-admin')
const { createStarsService } = require('../functions/shop-stars.cjs')

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run this test through npm run test:stars:rules. Production access is forbidden.')
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
if (host !== '127.0.0.1' && host !== 'localhost') throw new Error('Only a local Firestore emulator is allowed.')
let assertions = 0
for (const uid of [null, 'buyer', 'other']) {
  const app = initializeApp({ projectId: 'demo-leonida-stars', apiKey: 'local-emulator-only' }, `stars-rules-${uid}`)
  const db = getFirestore(app)
  connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid } } : undefined)
  try {
    for (const collection of ['shopStarsOrders', 'shopStarsCharges', 'shopStarsReview', 'shopStarsSupport', 'shopStarsAccounts', 'shopStarsRateLimits']) {
      const reference = doc(db, collection, 'test-record')
      for (const operation of [() => getDoc(reference), () => setDoc(reference, { ownerUid: uid, status: 'paid' }), () => deleteDoc(reference)]) {
        await assert.rejects(operation(), (error) => error.code === 'permission-denied')
        assertions++
      }
    }
  } finally { await terminate(db); await deleteApp(app) }
}
console.log(`Firestore rules passed ${assertions} denials across signed-out, owner, and other-user access. No production services were used.`)

// Exercise the real Admin SDK transaction/query contract as well as the rule boundary.
const app = admin.initializeApp({ projectId: 'demo-leonida-stars' }, 'stars-emulator-integration')
const db = app.firestore()
try {
  const service = createStarsService({ db, config: { enabled: true, botUsername: 'FSFESbot', botToken: 'local-test-only', webhookSecret: 'local-test-secret', siteOrigin: 'https://leonidaloot.com' },
    catalog: { overlay: { title: 'Test overlay', priceStars: 260, downloadUrl: 'https://drive.google.com/file/d/local/view', downloadFileName: 'overlay.png' } },
    telegram: async () => true,
  })
  const body = { productIds: ['overlay'], requestId: 'emulator-request-0001' }
  const [first, retry] = await Promise.all([service.createOrder('buyer', body), service.createOrder('buyer', body)])
  assert.equal(first.id, retry.id)
  const start = new URL(first.checkoutUrl).searchParams.get('start')
  await service.handleUpdate({ message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, text: `/start ${start}` } })
  const payment = { currency: 'XTR', total_amount: 260, invoice_payload: `stars:${first.id}`, telegram_payment_charge_id: 'emulator-charge' }
  await service.handleUpdate({ pre_checkout_query: { id: 'emulator-query', from: { id: 42 }, ...payment } })
  const update = { message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, successful_payment: payment } }
  await Promise.all([service.handleUpdate(update), service.handleUpdate(update)])
  assert.equal((await service.listOrders('buyer')).orders[0].status, 'paid')
  assert.equal((await service.download('buyer', first.id, 'overlay')).fileName, 'overlay.png')
  await service.refund(first.id)
  await assert.rejects(service.download('buyer', first.id, 'overlay'), { status: 409 })
  console.log('Real Firestore Admin SDK integration passed: concurrent creation, duplicate payments, history query, downloads, and refund revocation.')
} finally { await db.terminate(); await app.delete() }
