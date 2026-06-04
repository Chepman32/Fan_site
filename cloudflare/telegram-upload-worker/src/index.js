const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const JWKS_CACHE_MS = 60 * 60 * 1000

let cachedJwks = null
let cachedJwksAt = 0

export default {
  async fetch(request, env, context) {
    const cors = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/api/telegram/upload') {
      return json({ error: 'Not found.' }, 404, cors)
    }

    if (request.method !== 'POST') {
      return json({ error: 'Use POST to upload files.' }, 405, cors)
    }

    if (!isOriginAllowed(request, env)) {
      return json({ error: 'Origin is not allowed.' }, 403, cors)
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_STORAGE_CHAT_ID) {
      return json({ error: 'Telegram storage is not configured.' }, 500, cors)
    }

    if (!env.FIREBASE_PROJECT_ID) {
      return json({ error: 'Firebase project ID is not configured.' }, 500, cors)
    }

    try {
      const decodedToken = await requireFirebaseUser(request, env, context)
      const upload = await multipartUpload(request, env)
      const telegramResponse = await sendTelegramDocument(upload, decodedToken, env)

      return json(telegramResponse, 200, cors)
    } catch (error) {
      return json({ error: error.message || 'Telegram upload failed.' }, error.status || 500, cors)
    }
  },
}

function corsHeaders(request, env) {
  const requestOrigin = request.headers.get('origin')
  const allowedOrigins = configuredOrigins(env)
  const allowedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0] || requestOrigin || '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

function isOriginAllowed(request, env) {
  const allowedOrigins = configuredOrigins(env)
  if (!allowedOrigins.length) return true

  const requestOrigin = request.headers.get('origin')
  return !requestOrigin || allowedOrigins.includes(requestOrigin)
}

function configuredOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  })
}

function uploadLimit(env) {
  const configured = Number(env.TELEGRAM_MAX_UPLOAD_BYTES)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_BYTES
}

async function multipartUpload(request, env) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw httpError('Use multipart/form-data.', 415)
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  const maxBytes = uploadLimit(env)
  if (contentLength > maxBytes) {
    throw httpError('File is larger than the configured Telegram upload limit.', 413)
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    throw httpError('Attach one file to upload.', 400)
  }

  if (file.size > maxBytes) {
    throw httpError('File is larger than the configured Telegram upload limit.', 413)
  }

  return {
    file,
    kind: safeText(form.get('kind'), 60) || 'attachment',
    title: safeText(form.get('title'), 160),
  }
}

async function sendTelegramDocument(upload, decodedToken, env) {
  const telegramForm = new FormData()
  telegramForm.append('chat_id', env.TELEGRAM_STORAGE_CHAT_ID)
  telegramForm.append('caption', telegramCaption(upload, decodedToken))
  telegramForm.append('document', upload.file, safeFileName(upload.file.name))

  const response = await fetch(telegramApiUrl('sendDocument', env), {
    method: 'POST',
    body: telegramForm,
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.ok) {
    throw httpError(payload.description || 'Telegram rejected the upload.', 502)
  }

  const message = payload.result || {}
  const storedFile = message.document || message.video || message.animation || message.audio || {}

  return {
    name: storedFile.file_name || upload.file.name,
    size: storedFile.file_size || upload.file.size,
    type: storedFile.mime_type || upload.file.type || 'application/octet-stream',
    provider: 'telegram_bot',
    fileId: storedFile.file_id || '',
    fileUniqueId: storedFile.file_unique_id || '',
    messageId: message.message_id ? String(message.message_id) : '',
    kind: upload.kind,
    storageStatus: 'stored',
  }
}

function telegramCaption(upload, decodedToken) {
  return [
    'GTA VI Hub P2P upload',
    upload.title ? `Listing: ${upload.title}` : '',
    upload.kind ? `Kind: ${upload.kind}` : '',
    `Uploader: ${decodedToken.user_id || decodedToken.sub}`,
  ].filter(Boolean).join('\n').slice(0, 1024)
}

function telegramApiUrl(method, env) {
  const apiBaseUrl = (env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`
}

async function requireFirebaseUser(request, env, context) {
  const authHeader = request.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw httpError('Missing Firebase auth token.', 401)
  }

  return verifyFirebaseToken(match[1], env, context)
}

async function verifyFirebaseToken(token, env, context) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw httpError('Invalid Firebase auth token.', 401)
  }

  const header = decodeJson(encodedHeader)
  const payload = decodeJson(encodedPayload)
  const now = Math.floor(Date.now() / 1000)
  const expectedIssuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`

  if (payload.aud !== env.FIREBASE_PROJECT_ID || payload.iss !== expectedIssuer) {
    throw httpError('Firebase auth token is for another project.', 401)
  }

  if (!payload.sub || payload.exp <= now || payload.iat > now + 300) {
    throw httpError('Firebase auth token is expired or invalid.', 401)
  }

  const jwks = await getFirebaseJwks(context)
  const jwk = jwks.keys?.find((key) => key.kid === header.kid)
  if (!jwk) {
    throw httpError('Firebase signing key was not found.', 401)
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  const signature = base64UrlBytes(encodedSignature)
  const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)

  if (!verified) {
    throw httpError('Firebase auth token signature could not be verified.', 401)
  }

  return payload
}

async function getFirebaseJwks(context) {
  if (cachedJwks && Date.now() - cachedJwksAt < JWKS_CACHE_MS) {
    return cachedJwks
  }

  const response = await fetch(FIREBASE_JWKS_URL)
  if (!response.ok) {
    throw httpError('Firebase signing keys were not available.', 502)
  }

  cachedJwks = await response.json()
  cachedJwksAt = Date.now()
  context?.waitUntil?.(Promise.resolve())
  return cachedJwks
}

function decodeJson(value) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlBytes(value)))
  } catch {
    throw httpError('Invalid Firebase auth token.', 401)
  }
}

function base64UrlBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function safeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function safeFileName(value) {
  const reservedCharacters = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|'])
  const fileName = Array.from(safeText(value, 160), (character) => {
    return character.charCodeAt(0) < 32 || reservedCharacters.has(character) ? '_' : character
  }).join('')
  return fileName || 'listing-file'
}

function httpError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}
