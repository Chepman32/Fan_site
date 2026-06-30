const Busboy = require('busboy')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { TronWeb } = require('tronweb')

admin.initializeApp()

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const DEFAULT_MAX_POST_MEDIA_BYTES = 20 * 1024 * 1024
const DEFAULT_PLATFORM_USDT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
const IGN_ORIGIN = 'https://www.ign.com'
const IGN_NEWS_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,180}$/
const IGN_FETCH_TIMEOUT_MS = 12_000
const TRONGRID_FULL_HOST = process.env.TRONGRID_FULL_HOST || 'https://api.trongrid.io'
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const USDT_DECIMALS = 6
const USDT_UNIT = 10n ** BigInt(USDT_DECIMALS)
const USDT_TRANSFER_FEE_LIMIT = Number(process.env.USDT_TRANSFER_FEE_LIMIT || 100_000_000)
const RECENT_TRANSFER_LIMIT = 200
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

function setCorsHeaders(req, res, methods = 'POST, OPTIONS') {
  const origin = req.get('origin')
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range')
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, Content-Type')
}

function maxUploadBytes() {
  const configuredMax = Number(process.env.TELEGRAM_MAX_UPLOAD_BYTES)
  if (Number.isFinite(configuredMax) && configuredMax > 0) return configuredMax
  return DEFAULT_MAX_UPLOAD_BYTES
}

function platformUsdtAddress() {
  return String(process.env.P2P_PLATFORM_USDT_ADDRESS || DEFAULT_PLATFORM_USDT_ADDRESS).trim()
}

function payoutPrivateKey() {
  return String(process.env.P2P_PAYOUT_PRIVATE_KEY || process.env.TRON_PRIVATE_KEY || '').trim()
}

function p2pCommissionBasisPoints() {
  const configuredBps = process.env.P2P_COMMISSION_BPS
  if (configuredBps !== undefined) {
    const bps = Number(configuredBps)
    if (Number.isInteger(bps) && bps >= 0 && bps < 10_000) return bps
    throw httpError(500, 'P2P_COMMISSION_BPS must be an integer from 0 to 9999.')
  }

  const rate = Number(process.env.P2P_COMMISSION_RATE || 0.02)
  if (!Number.isFinite(rate) || rate < 0 || rate >= 1) {
    throw httpError(500, 'P2P_COMMISSION_RATE must be between 0 and 1.')
  }

  return Math.round(rate * 10_000)
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function safeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function safeFileName(value) {
  const fileName = safeText(value, 160).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
  return fileName || 'listing-file'
}

function decodeHtml(value = '') {
  const namedEntities = {
    amp: '&',
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return String(value || '')
    .replace(/&#(x?[0-9a-f]+);/gi, (_, rawCode) => {
      const code = rawCode.toLowerCase().startsWith('x')
        ? Number.parseInt(rawCode.slice(1), 16)
        : Number.parseInt(rawCode, 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ''
    })
    .replace(/&([a-z]+);/gi, (_, name) => namedEntities[name.toLowerCase()] || `&${name};`)
}

function normalizeWhitespace(value = '') {
  return decodeHtml(value).replace(/\s+/g, ' ').trim()
}

function stripHtml(value = '') {
  return normalizeWhitespace(String(value || '').replace(/<[^>]+>/g, ' '))
}

function tagAttribute(tag = '', name) {
  const match = String(tag || '').match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, 'i'))
  return decodeHtml(match?.[1] || match?.[2] || '')
}

function absoluteIgnContentUrl(url) {
  if (!url) return ''

  try {
    return new URL(decodeHtml(url), IGN_ORIGIN).toString()
  } catch {
    return ''
  }
}

function cleanIgnTitle(value = '') {
  return normalizeWhitespace(value)
    .replace(/\s+-\s+IGN$/i, '')
    .trim()
}

function cleanIgnDescription(value = '') {
  return normalizeWhitespace(value)
    .replace(/^(?:\d+[mhdw]\s+ago|just now)\s*(?:-\s*)?/i, '')
    .trim()
}

function titleFromSlug(slug = '') {
  const acronyms = new Set(['gta', 'ign', 'p2p', 'pc', 'ps4', 'ps5', 'rdr', 'usdt', 'vi'])
  const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the', 'to', 'with'])

  return normalizeWhitespace(slug)
    .split('-')
    .filter(Boolean)
    .map((part, index) => {
      if (/^\d+s$/.test(part)) return `${part.slice(0, -1)}'s`
      if (acronyms.has(part)) return part.toUpperCase()
      if (index > 0 && lowercaseWords.has(part)) return part
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    })
    .join(' ')
}

function articleIdFromSource(sourceUrl, title) {
  return `${sourceUrl || title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function normalizeIgnDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function inlineSegmentsFromHtml(innerHtml = '') {
  const segments = []
  const linkPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let lastIndex = 0
  let match

  const pushText = (html) => {
    const text = stripHtml(html)
    if (text) segments.push({ type: 'text', text })
  }

  while ((match = linkPattern.exec(innerHtml))) {
    pushText(innerHtml.slice(lastIndex, match.index))
    const text = stripHtml(match[2])
    const url = absoluteIgnContentUrl(tagAttribute(match[1], 'href'))
    if (text && url) {
      segments.push({ type: 'link', text, url })
    } else if (text) {
      segments.push({ type: 'text', text })
    }
    lastIndex = linkPattern.lastIndex
  }

  pushText(innerHtml.slice(lastIndex))
  return segments
}

function parseIgnContentBlocks(processedHtml = '') {
  const blocks = []
  const blockPattern = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>|<section\b([^>]*)>(?:<\/section>)?/gi
  let match

  while ((match = blockPattern.exec(processedHtml))) {
    if (match[1] !== undefined) {
      const segments = inlineSegmentsFromHtml(match[1])
      const text = segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim()
      if (text) blocks.push({ type: 'paragraph', text, segments })
      continue
    }

    const attrs = match[2] || ''
    const transform = tagAttribute(attrs, 'data-transform')
    const slug = tagAttribute(attrs, 'data-slug') || tagAttribute(attrs, 'data-value')
    const caption = tagAttribute(attrs, 'data-caption')

    if (transform === 'slideshow' && slug) {
      blocks.push({
        type: 'gallery',
        title: caption || titleFromSlug(slug),
        sourceUrl: `${IGN_ORIGIN}/slideshows/${slug}`,
      })
    }

    if (transform === 'ignvideo' && slug) {
      blocks.push({
        type: 'video',
        title: titleFromSlug(slug),
        sourceUrl: `${IGN_ORIGIN}/videos/${slug}`,
      })
    }
  }

  return blocks
}

function parseIgnNextPage(html) {
  const match = String(html || '').match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1])
    return parsed?.props?.pageProps?.page || null
  } catch {
    return null
  }
}

function findIgnArticleSchema(page) {
  if (!Array.isArray(page?.schema)) return null

  return page.schema.find((entry) => {
    const type = Array.isArray(entry?.['@type']) ? entry['@type'] : [entry?.['@type']]
    return type.some((item) => ['Article', 'NewsArticle', 'VideoObject'].includes(item))
  }) || null
}

function normalizeIgnArticlePage(page, sourceUrl) {
  if (!page) return null

  const schema = findIgnArticleSchema(page)
  const author = Array.isArray(page.contributors) && page.contributors.length
    ? page.contributors.map((contributor) => contributor.name).filter(Boolean).join(', ')
    : schema?.author?.name
  const image = page.image || page.feedImage?.url || (Array.isArray(schema?.image) ? schema.image[0] : schema?.image) || ''
  const blocks = parseIgnContentBlocks(page.processedHtml || '')

  return {
    id: page.id || page.articleId || articleIdFromSource(sourceUrl, page.pageTitle || page.feedTitle || page.title),
    slug: page.slug || '',
    title: cleanIgnTitle(page.pageTitle || page.feedTitle || schema?.headline || page.title || ''),
    description: cleanIgnDescription(page.description || page.excerpt || schema?.description || ''),
    author: normalizeWhitespace(author || 'IGN'),
    source: 'IGN',
    sourceUrl,
    publishedAt: normalizeIgnDate(page.publishDate || schema?.datePublished),
    updatedAt: normalizeIgnDate(page.updatedAt || schema?.dateModified),
    image: absoluteIgnContentUrl(image),
    blocks,
  }
}

function fallbackIgnArticleFromHtml(html, sourceUrl) {
  const title = cleanIgnTitle(
    html.match(/<h1\b[^>]*data-cy=["']article-headline["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1],
  )
  const description = cleanIgnDescription(
    html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1],
  )
  const image = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || ''
  const blocks = []
  const paragraphPattern = /<p\b[^>]*data-cy=["']paragraph["'][^>]*>([\s\S]*?)<\/p>/gi
  let match

  while ((match = paragraphPattern.exec(html))) {
    const segments = inlineSegmentsFromHtml(match[1])
    const text = segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim()
    if (text) blocks.push({ type: 'paragraph', text, segments })
  }

  return {
    id: articleIdFromSource(sourceUrl, title),
    slug: '',
    title,
    description,
    author: normalizeWhitespace(
      html.match(/<a\b[^>]*data-cy=["']article-author["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
      html.match(/<meta\b[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
      'IGN',
    ),
    source: 'IGN',
    sourceUrl,
    publishedAt: normalizeIgnDate(html.match(/<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]),
    updatedAt: normalizeIgnDate(html.match(/<meta\b[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]),
    image: absoluteIgnContentUrl(image),
    blocks,
  }
}

function parseIgnArticleHtml(html, sourceUrl) {
  const fromNext = normalizeIgnArticlePage(parseIgnNextPage(html), sourceUrl)
  if (fromNext?.title && fromNext.blocks?.length) return fromNext
  return fallbackIgnArticleFromHtml(html, sourceUrl)
}

function ignNewsSourceUrl(slug, type = 'article') {
  const collection = type === 'video' ? 'videos' : 'articles'
  return `${IGN_ORIGIN}/${collection}/${slug}`
}

async function fetchIgnHtml(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), IGN_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'LeonidaLootBot/1.0 (+https://leonidaloot.com)',
      },
    })

    if (!response.ok) {
      throw httpError(response.status === 404 ? 404 : 502, `IGN returned HTTP ${response.status}.`)
    }

    return response.text()
  } finally {
    clearTimeout(timeoutId)
  }
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

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body

  const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : String(req.rawBody || '')
  if (!rawBody.trim()) return {}

  try {
    return JSON.parse(rawBody)
  } catch {
    throw httpError(400, 'Request body must be valid JSON.')
  }
}

function normalizeTxId(value) {
  return String(value || '').trim().toLowerCase()
}

function assertTronAddress(address, label) {
  if (!TRON_ADDRESS_PATTERN.test(String(address || '').trim())) {
    throw httpError(400, `${label} must be a valid TRON address.`)
  }
}

function amountToUsdtUnits(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw httpError(400, 'Listing price must be a positive USDT amount.')
  }

  const fixedAmount = amount.toFixed(USDT_DECIMALS)
  const [whole, fraction = ''] = fixedAmount.split('.')

  return BigInt(whole) * USDT_UNIT + BigInt(fraction.padEnd(USDT_DECIMALS, '0'))
}

function usdtUnitsToString(units) {
  const whole = units / USDT_UNIT
  const fraction = (units % USDT_UNIT).toString().padStart(USDT_DECIMALS, '0').replace(/0+$/, '')

  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function createRecentUsdtTransfersUrl(recipientAddress) {
  const url = new URL(`/v1/accounts/${recipientAddress}/transactions/trc20`, TRONGRID_FULL_HOST)
  url.searchParams.set('limit', String(RECENT_TRANSFER_LIMIT))
  url.searchParams.set('contract_address', USDT_CONTRACT_ADDRESS)
  url.searchParams.set('only_confirmed', 'true')

  return url.toString()
}

async function fetchRecentUsdtTransfers(recipientAddress) {
  const headers = {}
  const apiKey = String(process.env.TRONGRID_API_KEY || '').trim()
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey

  const response = await fetch(createRecentUsdtTransfersUrl(recipientAddress), { headers })

  if (!response.ok) {
    throw httpError(502, `TRONGrid returned HTTP ${response.status}.`)
  }

  const payload = await response.json()

  if (payload?.success === false) {
    throw httpError(502, 'TRONGrid did not return a successful transfer response.')
  }

  return Array.isArray(payload?.data) ? payload.data : []
}

function transferAmountInUnits(transfer) {
  const value = String(transfer?.value ?? '').trim()
  return /^\d+$/.test(value) ? BigInt(value) : null
}

async function findConfirmedUsdtTransfer({ txId, expectedAmountUnits, recipientAddress }) {
  const transfers = await fetchRecentUsdtTransfers(recipientAddress)
  const transfer = transfers.find((candidate) => {
    return normalizeTxId(candidate?.transaction_id) === txId
  })

  if (!transfer) return { status: 'pending' }

  if (String(transfer?.to || '').trim() !== recipientAddress) {
    throw httpError(400, 'Transaction was confirmed, but it was not sent to the platform checkout address.')
  }

  if (String(transfer?.token_info?.address || '').trim().toLowerCase() !== USDT_CONTRACT_ADDRESS.toLowerCase()) {
    throw httpError(400, 'Transaction was confirmed, but it was not a USDT TRC20 transfer.')
  }

  const foundAmountUnits = transferAmountInUnits(transfer)
  if (foundAmountUnits !== expectedAmountUnits) {
    throw httpError(
      400,
      `Transaction sent ${usdtUnitsToString(foundAmountUnits ?? 0n)} USDT instead of ${usdtUnitsToString(expectedAmountUnits)} USDT.`,
    )
  }

  return { status: 'confirmed', transfer }
}

function createPayoutTronWeb() {
  const privateKey = payoutPrivateKey()
  if (!privateKey) {
    throw httpError(500, 'P2P payout private key is not configured.')
  }

  const signerAddress = TronWeb.address.fromPrivateKey(privateKey)
  if (signerAddress !== platformUsdtAddress()) {
    throw httpError(500, 'P2P payout private key does not match the platform USDT address.')
  }

  return new TronWeb({
    fullHost: TRONGRID_FULL_HOST,
    privateKey,
  })
}

function payoutTxIdFromResult(result) {
  if (typeof result === 'string') return result
  if (result?.txid) return result.txid
  if (result?.transaction?.txID) return result.transaction.txID
  return ''
}

async function sendSellerPayout({ tronWeb = createPayoutTronWeb(), sellerAddress, sellerPayoutUnits }) {
  const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS)
  const result = await contract.transfer(sellerAddress, sellerPayoutUnits.toString()).send({
    feeLimit: USDT_TRANSFER_FEE_LIMIT,
  })
  const payoutTxId = payoutTxIdFromResult(result)

  if (!payoutTxId) {
    throw httpError(502, 'TRON payout was submitted, but TronWeb did not return a transaction id.')
  }

  return payoutTxId
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
    'GTA VI Hub upload',
    fields.title ? `Title: ${safeText(fields.title, 160)}` : '',
    fields.kind ? `Kind: ${safeText(fields.kind, 60)}` : '',
    `Uploader: ${decodedToken.uid}`,
  ].filter(Boolean).join('\n').slice(0, 1024)
}

function telegramApiUrl(method) {
  const apiBaseUrl = (process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`
}

function telegramDownloadUrl(filePath) {
  const apiBaseUrl = (process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '')
  return `${apiBaseUrl}/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${String(filePath).replace(/^\/+/, '')}`
}

async function getTelegramFilePath(fileId) {
  const response = await fetch(`${telegramApiUrl('getFile')}?file_id=${encodeURIComponent(fileId)}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.ok || !payload.result?.file_path) {
    throw httpError(502, payload.description || 'Telegram could not resolve the media file.')
  }

  return payload.result.file_path
}

async function findPublicPostMedia(postId, fileId) {
  if (!postId || postId.length > 128 || postId.includes('/')) {
    throw httpError(400, 'Invalid post id.')
  }
  if (!fileId || fileId.length > 512) {
    throw httpError(400, 'Invalid Telegram file id.')
  }

  const postSnapshot = await admin.firestore().collection('posts').doc(postId).get()
  if (!postSnapshot.exists) throw httpError(404, 'Post media was not found.')

  const attachments = postSnapshot.data()?.attachments
  const attachment = Array.isArray(attachments)
    ? attachments.find((item) => item?.fileId === fileId || item?.thumbnailFileId === fileId)
    : null

  if (
    !attachment
    || attachment.kind !== 'ugc-post-media'
    || attachment.provider !== 'telegram_bot'
    || !/^(image|video)\//.test(attachment.type || '')
  ) {
    throw httpError(404, 'Post media was not found.')
  }

  return attachment.thumbnailFileId === fileId
    ? { ...attachment, type: 'image/jpeg' }
    : attachment
}

exports.ignNewsArticle = onRequest({
  region: 'us-central1',
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (req, res) => {
  setCorsHeaders(req, res, 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Use GET to fetch news articles.' })
    return
  }

  try {
    const slug = safeText(req.query.slug, 190).toLowerCase()
    const type = safeText(req.query.type, 20).toLowerCase() === 'video' ? 'video' : 'article'

    if (!IGN_NEWS_SLUG_PATTERN.test(slug)) {
      throw httpError(400, 'News slug must contain only lowercase letters, numbers, and hyphens.')
    }

    const sourceUrl = ignNewsSourceUrl(slug, type)
    const html = await fetchIgnHtml(sourceUrl)
    const article = parseIgnArticleHtml(html, sourceUrl)

    if (!article?.title || !article.blocks?.length) {
      throw httpError(502, 'IGN article could not be parsed.')
    }

    res.set('Cache-Control', 'public, max-age=600, s-maxage=1800')
    res.status(200).json({ article })
  } catch (error) {
    logger.warn('IGN news article fetch error', {
      status: error.status || 500,
      message: error.message,
    })
    res.status(error.status || 500).json({ error: error.message || 'News article fetch failed.' })
  }
})

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
    if (fields.kind === 'ugc-post-media') {
      if (!/^(image|video)\//.test(upload.mimeType)) {
        throw httpError(415, 'Post attachments must be images or videos.')
      }
      if (upload.size > DEFAULT_MAX_POST_MEDIA_BYTES) {
        throw httpError(413, 'Post images and videos must be 20 MB or smaller.')
      }
    }
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
    const thumbnail = storedFile.thumbnail || storedFile.thumb || {}

    res.status(200).json({
      name: storedFile.file_name || upload.filename,
      size: storedFile.file_size || upload.size,
      type: storedFile.mime_type || upload.mimeType,
      provider: 'telegram_bot',
      fileId: storedFile.file_id || '',
      fileUniqueId: storedFile.file_unique_id || '',
      thumbnailFileId: thumbnail.file_id || '',
      thumbnailFileUniqueId: thumbnail.file_unique_id || '',
      messageId: message.message_id ? String(message.message_id) : '',
      kind: fields.kind || 'attachment',
      storageStatus: 'stored',
    })
  } catch (error) {
    logger.error('Telegram upload error', error)
    res.status(error.status || 500).json({ error: error.message || 'Telegram upload failed.' })
  }
})

exports.telegramFile = onRequest({
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '1GiB',
}, async (req, res) => {
  setCorsHeaders(req, res, 'GET, HEAD, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    res.status(405).json({ error: 'Use GET to load post media.' })
    return
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    res.status(500).json({ error: 'Telegram storage is not configured.' })
    return
  }

  try {
    const postId = safeText(req.query.postId, 128)
    const fileId = String(req.query.fileId || '').trim()
    const attachment = await findPublicPostMedia(postId, fileId)
    const filePath = await getTelegramFilePath(fileId)
    const upstreamHeaders = {}
    const range = req.get('range')
    if (range) upstreamHeaders.Range = range

    const fileResponse = await fetch(telegramDownloadUrl(filePath), {
      method: req.method,
      headers: upstreamHeaders,
    })

    if (!fileResponse.ok && fileResponse.status !== 206) {
      throw httpError(502, 'Telegram could not stream the media file.')
    }

    const forwardedHeaders = ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified']
    forwardedHeaders.forEach((header) => {
      const value = fileResponse.headers.get(header)
      if (value) res.set(header, value)
    })
    res.set('Content-Type', attachment.type)
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    res.set('X-Content-Type-Options', 'nosniff')
    res.status(fileResponse.status)

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
    res.send(fileBuffer)
  } catch (error) {
    logger.warn('Telegram post media fetch error', {
      status: error.status || 500,
      message: error.message,
    })
    res.status(error.status || 500).json({ error: error.message || 'Post media could not be loaded.' })
  }
})

exports.p2pUsdtPayout = onRequest({
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB',
  secrets: ['P2P_PAYOUT_PRIVATE_KEY'],
}, async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST to verify P2P payment.' })
    return
  }

  try {
    const decodedToken = await requireFirebaseUser(req)
    const body = readJsonBody(req)
    const listingId = safeText(body.listingId, 120)
    const buyerTxId = normalizeTxId(body.txId)
    const platformAddress = platformUsdtAddress()
    const commissionBps = p2pCommissionBasisPoints()

    if (!listingId) throw httpError(400, 'Missing P2P listing id.')
    if (!/^[a-f0-9]{64}$/.test(buyerTxId)) {
      throw httpError(400, 'Transaction hash must be a 64-character TRON txid.')
    }

    assertTronAddress(platformAddress, 'Platform USDT address')

    const db = admin.firestore()
    const listingRef = db.collection('p2pListings').doc(listingId)
    const listingSnapshot = await listingRef.get()

    if (!listingSnapshot.exists) throw httpError(404, 'P2P listing was not found.')

    const listing = listingSnapshot.data()
    const buyerId = decodedToken.uid
    const sellerId = String(listing.sellerId || '')
    const sellerAddress = String(listing.cryptoWalletAddress || '').trim()
    const paymentMethods = Array.isArray(listing.paymentMethods) ? listing.paymentMethods : []
    const currency = String(listing.currency || 'USDT').toUpperCase()
    const grossAmountUnits = amountToUsdtUnits(listing.price)
    const commissionAmountUnits = (grossAmountUnits * BigInt(commissionBps)) / 10_000n
    const sellerPayoutUnits = grossAmountUnits - commissionAmountUnits

    if (sellerId === buyerId) throw httpError(400, 'You cannot buy your own P2P listing.')
    if (!paymentMethods.includes('crypto')) throw httpError(400, 'This listing does not accept crypto checkout.')
    if (!['USD', 'USDT'].includes(currency)) throw httpError(400, 'USDT checkout only supports USD or USDT listings.')

    assertTronAddress(sellerAddress, 'Seller payout address')

    const transferResult = await findConfirmedUsdtTransfer({
      txId: buyerTxId,
      expectedAmountUnits: grossAmountUnits,
      recipientAddress: platformAddress,
    })

    const amountSummary = {
      grossAmount: usdtUnitsToString(grossAmountUnits),
      commissionAmount: usdtUnitsToString(commissionAmountUnits),
      sellerPayoutAmount: usdtUnitsToString(sellerPayoutUnits),
      commissionBasisPoints: commissionBps,
      commissionRate: commissionBps / 10_000,
    }

    if (transferResult.status === 'pending') {
      res.status(200).json({
        status: 'pending',
        message: 'Payment is not confirmed in the platform USDT feed yet. Checking again shortly.',
        buyerTxId,
        platformAddress,
        ...amountSummary,
      })
      return
    }

    const dealRef = db.collection('p2pDeals').doc(buyerTxId)
    const existingDealSnapshot = await dealRef.get()
    const payoutTronWeb = existingDealSnapshot.exists ? null : createPayoutTronWeb()
    const lockResult = await db.runTransaction(async (transaction) => {
      const [dealSnapshot, freshListingSnapshot] = await Promise.all([
        transaction.get(dealRef),
        transaction.get(listingRef),
      ])

      if (dealSnapshot.exists) {
        const existingDeal = dealSnapshot.data()

        if (existingDeal.listingId !== listingId || existingDeal.buyerId !== buyerId) {
          throw httpError(409, 'This transaction hash is already attached to another P2P deal.')
        }

        return {
          action: 'existing',
          deal: {
            id: dealSnapshot.id,
            ...existingDeal,
          },
        }
      }

      if (!freshListingSnapshot.exists) throw httpError(404, 'P2P listing was not found.')

      const freshListing = freshListingSnapshot.data()
      if (freshListing.status === 'sold') {
        throw httpError(409, 'This P2P listing is already sold. Contact support for refund handling.')
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp()
      const dealPayload = {
        buyerId,
        sellerId,
        listingId,
        listingTitle: String(freshListing.title || listing.title || '').slice(0, 90),
        status: 'processing',
        network: 'USDT TRC20',
        buyerTxId,
        payoutTxId: '',
        platformAddress,
        sellerWalletAddress: sellerAddress,
        grossAmount: amountSummary.grossAmount,
        commissionAmount: amountSummary.commissionAmount,
        sellerPayoutAmount: amountSummary.sellerPayoutAmount,
        commissionBasisPoints: commissionBps,
        commissionRate: amountSummary.commissionRate,
        createdAt: timestamp,
        updatedAt: timestamp,
        processingStartedAt: timestamp,
      }

      transaction.set(dealRef, dealPayload)
      transaction.update(listingRef, {
        status: 'sold',
        updatedAt: timestamp,
      })

      return {
        action: 'payout',
        deal: {
          id: buyerTxId,
          ...dealPayload,
        },
      }
    })

    if (lockResult.action === 'existing') {
      const deal = lockResult.deal

      if (deal.status === 'payout_sent') {
        res.status(200).json({
          status: 'success',
          message: 'Payment was already verified and seller payout was submitted.',
          dealId: deal.id,
          buyerTxId: deal.buyerTxId,
          payoutTxId: deal.payoutTxId,
          platformAddress: deal.platformAddress,
          grossAmount: deal.grossAmount,
          commissionAmount: deal.commissionAmount,
          sellerPayoutAmount: deal.sellerPayoutAmount,
          commissionBasisPoints: deal.commissionBasisPoints,
          commissionRate: deal.commissionRate,
        })
        return
      }

      if (deal.status === 'payout_failed') {
        throw httpError(409, 'Payment is verified, but automatic payout failed. Contact support.')
      }

      res.status(200).json({
        status: 'pending',
        message: 'Payment is verified and seller payout is already processing.',
        dealId: deal.id,
        buyerTxId: deal.buyerTxId,
        platformAddress: deal.platformAddress,
        grossAmount: deal.grossAmount,
        commissionAmount: deal.commissionAmount,
        sellerPayoutAmount: deal.sellerPayoutAmount,
        commissionBasisPoints: deal.commissionBasisPoints,
        commissionRate: deal.commissionRate,
      })
      return
    }

    let payoutTxId = ''

    try {
      payoutTxId = await sendSellerPayout({ tronWeb: payoutTronWeb || undefined, sellerAddress, sellerPayoutUnits })
    } catch (payoutError) {
      await dealRef.set({
        status: 'payout_failed',
        payoutError: safeText(payoutError.message, 240),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })

      throw httpError(502, 'Payment verified, but automatic seller payout failed. Contact support.')
    }

    await dealRef.set({
      status: 'payout_sent',
      payoutTxId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    res.status(200).json({
      status: 'success',
      message: 'Payment verified. Seller payout was submitted automatically.',
      dealId: buyerTxId,
      buyerTxId,
      payoutTxId,
      platformAddress,
      ...amountSummary,
    })
  } catch (error) {
    logger.error('P2P USDT payout error', error)
    res.status(error.status || 500).json({ error: error.message || 'P2P payout failed.' })
  }
})
