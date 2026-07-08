import { getFirebaseServices } from '../firebase/firebaseClient'

const ERROR_LOG_COLLECTION = 'clientErrorLogs'
const MAX_LOGS_PER_SESSION = 5
const SESSION_ID_KEY = 'leonida.clientErrorSessionId'
const SESSION_COUNT_KEY = 'leonida.clientErrorLogCount'
const MAX_STRING_LENGTHS = {
  name: 120,
  message: 500,
  stack: 4000,
  componentStack: 4000,
  details: 1000,
  code: 120,
  filename: 500,
  pagePath: 500,
  referrerHost: 200,
  userAgent: 300,
  language: 40,
  viewport: 40,
  mode: 40,
  release: 80,
  sessionId: 80,
  fingerprint: 120,
}
const IGNORED_NAMES = new Set(['AbortError', 'CanceledError'])
const IGNORED_MESSAGE_PATTERNS = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /Non-Error promise rejection captured with value: undefined/i,
]

let listenersInstalled = false
const loggedFingerprints = new Set()

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function storageGet(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Session storage can be unavailable in private or embedded contexts.
  }
}

function randomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function getSessionId() {
  const existingSessionId = storageGet(SESSION_ID_KEY)
  if (existingSessionId) return existingSessionId

  const nextSessionId = randomId()
  storageSet(SESSION_ID_KEY, nextSessionId)
  return nextSessionId
}

function getSessionLogCount() {
  const count = Number.parseInt(storageGet(SESSION_COUNT_KEY) || '0', 10)
  return Number.isFinite(count) ? count : 0
}

function incrementSessionLogCount() {
  storageSet(SESSION_COUNT_KEY, String(getSessionLogCount() + 1))
}

function truncate(value, maxLength) {
  const text = typeof value === 'string' ? value : String(value ?? '')
  if (text.length <= maxLength) return text

  return `${text.slice(0, maxLength - 3)}...`
}

function primitiveValue(value) {
  return value == null || ['boolean', 'number', 'string'].includes(typeof value)
}

function stringifyDetails(value) {
  if (!value || typeof value !== 'object') return ''

  const details = {}
  for (const key of Object.keys(value).slice(0, 12)) {
    const entry = value[key]
    if (primitiveValue(entry)) {
      details[key] = entry
    }
  }

  try {
    return JSON.stringify(details)
  } catch {
    return ''
  }
}

function normalizeError(errorOrReason) {
  if (errorOrReason instanceof Error) {
    return {
      name: errorOrReason.name || 'Error',
      message: errorOrReason.message || 'Unknown error',
      stack: errorOrReason.stack || '',
      code: typeof errorOrReason.code === 'string' ? errorOrReason.code : '',
      details: stringifyDetails(errorOrReason),
    }
  }

  if (errorOrReason && typeof errorOrReason === 'object') {
    const name = typeof errorOrReason.name === 'string'
      ? errorOrReason.name
      : errorOrReason.constructor?.name || 'NonErrorObject'
    const message = typeof errorOrReason.message === 'string'
      ? errorOrReason.message
      : stringifyDetails(errorOrReason) || 'Unhandled non-error object'

    return {
      name,
      message,
      stack: typeof errorOrReason.stack === 'string' ? errorOrReason.stack : '',
      code: typeof errorOrReason.code === 'string' ? errorOrReason.code : '',
      details: stringifyDetails(errorOrReason),
    }
  }

  return {
    name: typeof errorOrReason,
    message: String(errorOrReason ?? 'Unknown error'),
    stack: '',
    code: '',
    details: '',
  }
}

function pagePath() {
  if (!isBrowser()) return ''

  return `${window.location.pathname}${window.location.hash}`
}

function referrerHost() {
  if (!isBrowser() || !document.referrer) return ''

  try {
    return new URL(document.referrer).host
  } catch {
    return ''
  }
}

function viewport() {
  if (!isBrowser()) return ''

  return `${window.innerWidth}x${window.innerHeight}`
}

function safeNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function hashText(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0
  }

  return Math.abs(hash).toString(36)
}

function firstStackLine(stack) {
  return stack.split('\n').find((line) => line.trim()) || ''
}

function shouldIgnoreError(error) {
  if (IGNORED_NAMES.has(error.name)) return true
  if (!error.message && !error.stack) return true
  if (IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(error.message))) return true

  return navigator.onLine === false && /fetch|network|load failed/i.test(error.message)
}

function buildPayload(errorOrReason, context = {}) {
  const error = normalizeError(errorOrReason)
  const source = context.source || 'runtime'
  const fingerprint = hashText([
    source,
    error.name,
    error.message,
    firstStackLine(error.stack),
    context.componentStack || '',
  ].join('|'))

  return {
    severity: 'critical',
    source,
    name: truncate(error.name, MAX_STRING_LENGTHS.name),
    message: truncate(error.message, MAX_STRING_LENGTHS.message),
    stack: truncate(error.stack, MAX_STRING_LENGTHS.stack),
    componentStack: truncate(context.componentStack || '', MAX_STRING_LENGTHS.componentStack),
    details: truncate(error.details, MAX_STRING_LENGTHS.details),
    code: truncate(error.code || context.code || '', MAX_STRING_LENGTHS.code),
    filename: truncate(context.filename || '', MAX_STRING_LENGTHS.filename),
    line: safeNumber(context.lineno),
    column: safeNumber(context.colno),
    pagePath: truncate(pagePath(), MAX_STRING_LENGTHS.pagePath),
    referrerHost: truncate(referrerHost(), MAX_STRING_LENGTHS.referrerHost),
    userAgent: truncate(navigator.userAgent || '', MAX_STRING_LENGTHS.userAgent),
    language: truncate(navigator.language || '', MAX_STRING_LENGTHS.language),
    viewport: truncate(viewport(), MAX_STRING_LENGTHS.viewport),
    online: navigator.onLine,
    mode: truncate(import.meta.env.MODE || '', MAX_STRING_LENGTHS.mode),
    release: truncate(import.meta.env.VITE_APP_VERSION || '', MAX_STRING_LENGTHS.release),
    sessionId: truncate(getSessionId(), MAX_STRING_LENGTHS.sessionId),
    fingerprint: truncate(fingerprint, MAX_STRING_LENGTHS.fingerprint),
  }
}

export async function logCriticalClientError(errorOrReason, context = {}) {
  if (!isBrowser()) return

  const normalizedError = normalizeError(errorOrReason)
  if (shouldIgnoreError(normalizedError)) return

  const payload = buildPayload(errorOrReason, context)
  if (loggedFingerprints.has(payload.fingerprint)) return
  if (getSessionLogCount() >= MAX_LOGS_PER_SESSION) return

  loggedFingerprints.add(payload.fingerprint)
  incrementSessionLogCount()

  try {
    const services = await getFirebaseServices()
    const userId = services.auth.currentUser?.uid || null
    await services.addDoc(services.collection(services.db, ERROR_LOG_COLLECTION), {
      ...payload,
      userId,
      createdAt: services.serverTimestamp(),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Critical client error was not logged.', error)
    }
  }
}

export function installCriticalErrorLogging() {
  if (!isBrowser() || listenersInstalled) return

  listenersInstalled = true
  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return

    logCriticalClientError(event.error || event.message, {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason == null) return

    logCriticalClientError(event.reason, {
      source: 'unhandledrejection',
    })
  })
}
