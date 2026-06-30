const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const DEFAULT_MAX_POST_MEDIA_BYTES = 20 * 1024 * 1024
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const JWKS_CACHE_MS = 60 * 60 * 1000

let cachedJwks = null
let cachedJwksAt = 0

export default {
  async fetch(request, env, context) {
    const cors = corsHeaders(request, env)
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (!isOriginAllowed(request, env)) {
      return json({ error: 'Origin is not allowed.' }, 403, cors)
    }

    if (url.pathname === '/api/telegram/file') {
      return servePostMedia(request, url, env, cors)
    }

    if (url.pathname !== '/api/telegram/upload') {
      return json({ error: 'Not found.' }, 404, cors)
    }

    if (request.method !== 'POST') {
      return json({ error: 'Use POST to upload files.' }, 405, cors)
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
      if (upload.kind === 'ugc-post-media') {
        if (!/^(image|video)\//.test(upload.file.type)) {
          throw httpError('Post attachments must be images or videos.', 415)
        }
        if (upload.file.size > DEFAULT_MAX_POST_MEDIA_BYTES) {
          throw httpError('Post images and videos must be 20 MB or smaller.', 413)
        }
      }
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
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
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
  const thumbnail = storedFile.thumbnail || storedFile.thumb || {}

  return {
    name: storedFile.file_name || upload.file.name,
    size: storedFile.file_size || upload.file.size,
    type: storedFile.mime_type || upload.file.type || 'application/octet-stream',
    provider: 'telegram_bot',
    fileId: storedFile.file_id || '',
    fileUniqueId: storedFile.file_unique_id || '',
    thumbnailFileId: thumbnail.file_id || '',
    thumbnailFileUniqueId: thumbnail.file_unique_id || '',
    messageId: message.message_id ? String(message.message_id) : '',
    kind: upload.kind,
    storageStatus: 'stored',
  }
}

function telegramCaption(upload, decodedToken) {
  return [
    'GTA VI Hub upload',
    upload.title ? `Title: ${upload.title}` : '',
    upload.kind ? `Kind: ${upload.kind}` : '',
    `Uploader: ${decodedToken.user_id || decodedToken.sub}`,
  ].filter(Boolean).join('\n').slice(0, 1024)
}

function telegramApiUrl(method, env) {
  const apiBaseUrl = (env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`
}

function telegramDownloadUrl(filePath, env) {
  const apiBaseUrl = (env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/file/bot${env.TELEGRAM_BOT_TOKEN}/${String(filePath).replace(/^\/+/, '')}`
}

async function servePostMedia(request, url, env, cors) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return json({ error: 'Use GET to load post media.' }, 405, cors)
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.FIREBASE_PROJECT_ID) {
    return json({ error: 'Telegram storage is not configured.' }, 500, cors)
  }

  try {
    const postId = safeText(url.searchParams.get('postId'), 128)
    const fileId = String(url.searchParams.get('fileId') || '').trim()
    const attachment = await findPublicPostMedia(postId, fileId, env)
    const filePath = await getTelegramFilePath(fileId, env)
    const upstreamHeaders = new Headers()
    const range = request.headers.get('range')
    if (range) upstreamHeaders.set('Range', range)

    const fileResponse = await fetch(telegramDownloadUrl(filePath, env), {
      method: request.method,
      headers: upstreamHeaders,
    })

    if (!fileResponse.ok && fileResponse.status !== 206) {
      throw httpError('Telegram could not stream the media file.', 502)
    }

    const headers = new Headers(cors)
    for (const header of ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified']) {
      const value = fileResponse.headers.get(header)
      if (value) headers.set(header, value)
    }
    headers.set('Content-Type', attachment.type)
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    headers.set('X-Content-Type-Options', 'nosniff')

    return new Response(request.method === 'HEAD' ? null : fileResponse.body, {
      status: fileResponse.status,
      headers,
    })
  } catch (error) {
    return json({ error: error.message || 'Post media could not be loaded.' }, error.status || 500, cors)
  }
}

async function getTelegramFilePath(fileId, env) {
  const response = await fetch(`${telegramApiUrl('getFile', env)}?file_id=${encodeURIComponent(fileId)}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.ok || !payload.result?.file_path) {
    throw httpError(payload.description || 'Telegram could not resolve the media file.', 502)
  }

  return payload.result.file_path
}

async function findPublicPostMedia(postId, fileId, env) {
  if (!postId || postId.length > 128 || postId.includes('/')) {
    throw httpError('Invalid post id.', 400)
  }
  if (!fileId || fileId.length > 512) {
    throw httpError('Invalid Telegram file id.', 400)
  }

  const documentUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/posts/${encodeURIComponent(postId)}`,
  )
  const response = await fetch(documentUrl)
  if (response.status === 404) throw httpError('Post media was not found.', 404)
  if (!response.ok) throw httpError('Post media could not be verified.', 502)

  const document = await response.json()
  const post = firestoreValue({ mapValue: { fields: document.fields || {} } })
  const attachment = Array.isArray(post.attachments)
    ? post.attachments.find((item) => item?.fileId === fileId || item?.thumbnailFileId === fileId)
    : null

  if (
    !attachment
    || attachment.kind !== 'ugc-post-media'
    || attachment.provider !== 'telegram_bot'
    || !/^(image|video)\//.test(attachment.type || '')
  ) {
    throw httpError('Post media was not found.', 404)
  }

  return attachment.thumbnailFileId === fileId
    ? { ...attachment, type: 'image/jpeg' }
    : attachment
}

function firestoreValue(value = {}) {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(firestoreValue)
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, fieldValue]) => [key, firestoreValue(fieldValue)]),
    )
  }
  return undefined
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
