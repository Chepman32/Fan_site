import { getFirebaseServices } from '../firebase/firebaseClient'
import { starsEndpoint } from './starsEndpoint'

async function request(path, { authenticated = true, signal, ...options } = {}) {
  let user
  const headers = { ...options.headers }
  if (authenticated) {
    const services = await getFirebaseServices()
    user = services.auth.currentUser
    if (!user) throw new Error('Sign in to pay with Stars.')
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }
  if (options.body) headers['Content-Type'] = 'application/json'
  const base = starsEndpoint(import.meta.env.VITE_TELEGRAM_STARS_API_ENDPOINT)
  const response = await fetch(`${base}${path}`, {
    ...options, headers, signal: signal || AbortSignal.timeout(15_000), cache: 'no-store',
  })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const result = isJson ? await response.json().catch(() => null) : null
  if (!response.ok || !result) {
    throw Object.assign(new Error(result?.error || 'Telegram Stars payments are temporarily unavailable.'), { status: response.status })
  }
  if (user) {
    const services = await getFirebaseServices()
    if (services.auth.currentUser?.uid !== user.uid) throw new Error('Your account changed. Please reopen checkout.')
  }
  return result
}

export function starsConfig(signal) { return request('/config', { authenticated: false, signal }) }
export function createStarsOrder(productIds, requestId) {
  return request('/orders', { method: 'POST', body: JSON.stringify({ productIds, requestId }) })
}
export function getStarsOrder(id, signal) { return request(`/orders/${encodeURIComponent(id)}`, { signal }) }
export function listStarsOrders(cursor, signal) {
  return request(`/orders${cursor ? `?after=${encodeURIComponent(cursor)}` : ''}`, { signal })
}
export async function starsDownload(orderId, productId) {
  const result = await request(`/orders/${encodeURIComponent(orderId)}/download`, {
    method: 'POST', body: JSON.stringify({ productId }),
  })
  const url = new URL(result.downloadUrl)
  if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com') throw new Error('The download link is unavailable.')
  return url.href
}

export function rememberStarsOrder(uid, id) {
  try {
    if (id) window.sessionStorage.setItem(`shop_stars_v1_${uid}`, id)
    else window.sessionStorage.removeItem(`shop_stars_v1_${uid}`)
  } catch { /* Purchase history remains available when storage is disabled. */ }
}
export function savedStarsOrder(uid) {
  try {
    const id = window.sessionStorage.getItem(`shop_stars_v1_${uid}`)
    return /^[a-f0-9]{32}$/.test(id || '') ? id : null
  } catch { return null }
}

export function safeStarsCheckoutUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 't.me' && /^\/[A-Za-z0-9_]{5,32}$/.test(url.pathname)
      && /^s_[a-f0-9]{32}_[A-Za-z0-9_-]{22}$/.test(url.searchParams.get('start') || '') ? url.href : null
  } catch { return null }
}
