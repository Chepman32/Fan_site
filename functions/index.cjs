const Busboy = require('busboy')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')

admin.initializeApp()

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024

function setCorsHeaders(req, res) {
  const origin = req.get('origin')
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

function maxUploadBytes() {
  const configuredMax = Number(process.env.TELEGRAM_MAX_UPLOAD_BYTES)
  if (Number.isFinite(configuredMax) && configuredMax > 0) return configuredMax
  return DEFAULT_MAX_UPLOAD_BYTES
}

function safeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function safeFileName(value) {
  const fileName = safeText(value, 160).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
  return fileName || 'listing-file'
}

async function requireFirebaseUser(req) {
  const authHeader = req.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    const error = new Error('Missing Firebase auth token.')
    error.status = 401
    throw error
  }

  return admin.auth().verifyIdToken(match[1])
}

function parseMultipartUpload(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fields: 8,
        fileSize: maxUploadBytes(),
      },
    })
    const fields = {}
    let upload
    let uploadTooLarge = false

    busboy.on('field', (name, value) => {
      fields[name] = safeText(value, 520)
    })

    busboy.on('file', (name, file, info) => {
      if (name !== 'file') {
        file.resume()
        return
      }

      const chunks = []
      let size = 0

      file.on('data', (chunk) => {
        size += chunk.length
        chunks.push(chunk)
      })

      file.on('limit', () => {
        uploadTooLarge = true
        file.resume()
      })

      file.on('end', () => {
        upload = {
          buffer: Buffer.concat(chunks),
          filename: safeFileName(info.filename),
          mimeType: info.mimeType || 'application/octet-stream',
          size,
        }
      })
    })

    busboy.on('error', reject)
    busboy.on('finish', () => {
      if (uploadTooLarge) {
        const error = new Error('File is larger than the configured Telegram upload limit.')
        error.status = 413
        reject(error)
        return
      }

      if (!upload) {
        const error = new Error('Attach one file to upload.')
        error.status = 400
        reject(error)
        return
      }

      resolve({ fields, upload })
    })

    if (req.rawBody) {
      busboy.end(req.rawBody)
      return
    }

    req.pipe(busboy)
  })
}

function telegramCaption(fields, decodedToken) {
  return [
    'GTA VI Hub P2P upload',
    fields.title ? `Listing: ${safeText(fields.title, 160)}` : '',
    fields.kind ? `Kind: ${safeText(fields.kind, 60)}` : '',
    `Uploader: ${decodedToken.uid}`,
  ].filter(Boolean).join('\n').slice(0, 1024)
}

function telegramApiUrl(method) {
  const apiBaseUrl = (process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`
}

exports.telegramUpload = onRequest({
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '1GiB',
}, async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST to upload files.' })
    return
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_STORAGE_CHAT_ID) {
    res.status(500).json({ error: 'Telegram storage is not configured.' })
    return
  }

  if (!req.get('content-type')?.includes('multipart/form-data')) {
    res.status(415).json({ error: 'Use multipart/form-data.' })
    return
  }

  try {
    const decodedToken = await requireFirebaseUser(req)
    const { fields, upload } = await parseMultipartUpload(req)
    const telegramForm = new FormData()
    telegramForm.append('chat_id', process.env.TELEGRAM_STORAGE_CHAT_ID)
    telegramForm.append('caption', telegramCaption(fields, decodedToken))
    telegramForm.append('document', new Blob([upload.buffer], { type: upload.mimeType }), upload.filename)

    const telegramResponse = await fetch(telegramApiUrl('sendDocument'), {
      method: 'POST',
      body: telegramForm,
    })
    const telegramPayload = await telegramResponse.json().catch(() => ({}))

    if (!telegramResponse.ok || !telegramPayload.ok) {
      logger.warn('Telegram upload failed', {
        status: telegramResponse.status,
        description: telegramPayload.description,
      })
      res.status(502).json({ error: telegramPayload.description || 'Telegram rejected the upload.' })
      return
    }

    const message = telegramPayload.result || {}
    const storedFile = message.document || message.video || message.animation || message.audio || {}

    res.status(200).json({
      name: storedFile.file_name || upload.filename,
      size: storedFile.file_size || upload.size,
      type: storedFile.mime_type || upload.mimeType,
      provider: 'telegram_bot',
      fileId: storedFile.file_id || '',
      fileUniqueId: storedFile.file_unique_id || '',
      messageId: message.message_id ? String(message.message_id) : '',
      kind: fields.kind || 'attachment',
      storageStatus: 'stored',
    })
  } catch (error) {
    logger.error('P2P Telegram upload error', error)
    res.status(error.status || 500).json({ error: error.message || 'Telegram upload failed.' })
  }
})
