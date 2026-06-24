export const IGN_GAME_URL = 'https://www.ign.com/games/grand-theft-auto-vi'
export const IGN_ORIGIN = 'https://www.ign.com'

export const MAX_ARTICLES = 80
export const INITIAL_ARTICLE_COUNT = 6
export const FETCH_TIMEOUT_MS = 10000

export const FALLBACK_NEWS = [
  {
    id: 'ign-gta-vi-page',
    title: 'Grand Theft Auto VI',
    author: 'IGN',
    source: 'IGN',
    type: 'Game page',
    publishedAt: '',
    summary: 'Open IGN coverage for the latest Grand Theft Auto VI news, videos, previews, and updates.',
    url: IGN_GAME_URL,
  },
]

function stripText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function cleanTitle(value = '') {
  return stripText(value)
    .replace(/^(?:\d{1,2}:\d{2}\s+)?\d+[mhdw]\s+ago\s+/i, '')
    .replace(/\s+\d+[mhdw]\s+ago\s+-\s+.*$/i, '')
    .replace(/\s+\d+[mhdw]\s+ago\s+(?:GTA\s?6|GTA Online|Grand Theft Auto VI).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanSummary(value = '') {
  return stripText(value)
    .replace(/^(?:\d+[mhdw]\s+ago|just now)\s*(?:-\s*)?/i, '')
    .trim()
}

export function absoluteIgnUrl(url) {
  if (!url) return ''

  try {
    return new URL(url, IGN_ORIGIN).toString()
  } catch {
    return ''
  }
}

function normalizeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function relativeDateFromText(value = '') {
  const match = stripText(value).match(/(\d+)([mhdw])\s+ago/i)
  if (!match) return ''

  const amount = Number(match[1])
  const unitMs = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  }[match[2].toLowerCase()]

  return unitMs ? new Date(Date.now() - amount * unitMs).toISOString() : ''
}

export function articleId(url, title) {
  return `${url || title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function isGtaArticle(article) {
  const haystack = `${article.title} ${article.url}`.toLowerCase()
  return (
    haystack.includes('gta-6') ||
    haystack.includes('gta-vi') ||
    haystack.includes('grand-theft-auto-6') ||
    haystack.includes('grand-theft-auto-vi') ||
    haystack.includes('grand theft auto 6') ||
    haystack.includes('grand theft auto vi')
  )
}

function addArticle(articles, article) {
  const url = absoluteIgnUrl(article.url)
  const title = cleanTitle(article.title)

  if (!url || !title || title.length < 8) return
  if (!url.startsWith(`${IGN_ORIGIN}/`)) return

  const normalizedArticle = {
    id: articleId(url, title),
    title,
    url,
    author: stripText(article.author || 'IGN'),
    source: 'IGN',
    publishedAt: normalizeDate(article.publishedAt || article.datePublished || article.date),
    summary: cleanSummary(article.summary || article.description || ''),
    type: stripText(article.type || 'Article'),
  }

  if (!isGtaArticle(normalizedArticle)) return

  const duplicate = articles.some((item) => item.url === normalizedArticle.url || item.title === normalizedArticle.title)
  if (!duplicate) articles.push(normalizedArticle)
}

function readJsonLdArticles(document, articles) {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')

  scripts.forEach((script) => {
    try {
      const parsed = JSON.parse(script.textContent.trim())
      const nodes = Array.isArray(parsed) ? parsed : [parsed]

      nodes.forEach((node) => {
        const graph = Array.isArray(node['@graph']) ? node['@graph'] : [node]
        graph.forEach((entry) => {
          const entryType = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']]
          if (!entryType.some((type) => ['Article', 'NewsArticle', 'VideoObject'].includes(type))) return

          addArticle(articles, {
            title: entry.headline || entry.name,
            url: entry.url || entry.mainEntityOfPage?.['@id'] || entry.mainEntityOfPage,
            author: Array.isArray(entry.author) ? entry.author.map((author) => author.name).join(', ') : entry.author?.name,
            publishedAt: entry.datePublished || entry.uploadDate,
            summary: entry.description,
            type: entryType.includes('VideoObject') ? 'Video' : 'Article',
          })
        })
      })
    } catch {
      // IGN can embed unrelated JSON-LD; skip malformed blocks.
    }
  })
}

function walkJson(value, visit, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)
  visit(value)

  Object.values(value).forEach((child) => walkJson(child, visit, seen))
}

function readNextDataArticles(document, articles) {
  const script = document.querySelector('#__NEXT_DATA__')
  if (!script?.textContent) return

  try {
    const nextData = JSON.parse(script.textContent.trim())
    walkJson(nextData, (node) => {
      const title = node.title || node.headline || node.name
      const url = node.url || node.href || node.canonicalUrl || node.slug
      if (!title || !url) return

      addArticle(articles, {
        title,
        url,
        author: node.author?.name || node.author || node.byline || node.authorName,
        publishedAt: node.publishedAt || node.publishDate || node.datePublished || node.createdAt,
        summary: node.description || node.summary || node.subtitle,
        type: node.type || node.contentType,
      })
    })
  } catch {
    // The page still has anchor cards if Next data changes.
  }
}

function readContentItemArticles(document, articles) {
  document.querySelectorAll('[data-cy="content-item"]').forEach((item) => {
    const anchor = item.querySelector('a[data-cy="item-body"][href]')
    const url = absoluteIgnUrl(anchor?.getAttribute('href'))

    if (!url.includes('/articles/') && !url.includes('/videos/')) return

    const title = stripText(item.querySelector('[data-cy="item-title"]')?.textContent || anchor?.getAttribute('aria-label'))
    const summary = stripText(item.querySelector('[data-cy="item-subtitle"]')?.textContent)
    const relativeDate = stripText(item.querySelector('.item-publish-date')?.textContent || summary)
    const author = stripText(item.querySelector('a[href^="/person/"]')?.textContent || 'IGN')
    const isVideo = url.includes('/videos/') || Boolean(item.querySelector('.video-duration'))

    addArticle(articles, {
      title,
      url,
      author,
      publishedAt: relativeDateFromText(relativeDate),
      summary,
      type: isVideo ? 'Video' : 'Article',
    })
  })
}

function readAnchorArticles(document, articles) {
  document.querySelectorAll('a[href]').forEach((anchor) => {
    const url = absoluteIgnUrl(anchor.getAttribute('href'))
    const title = stripText(anchor.querySelector('[data-cy="item-title"]')?.textContent || anchor.getAttribute('aria-label') || anchor.textContent)
    const summary = stripText(anchor.querySelector('[data-cy="item-subtitle"]')?.textContent)

    if (!url.includes('/articles/') && !url.includes('/videos/')) return
    if (!title || title.length < 18 || title.length > 180) return

    addArticle(articles, {
      title,
      url,
      publishedAt: anchor.querySelector('time')?.dateTime || relativeDateFromText(stripText(anchor.querySelector('.item-publish-date')?.textContent || anchor.textContent)),
      summary,
      type: url.includes('/videos/') ? 'Video' : 'Article',
    })
  })
}

function sortArticles(articles) {
  return [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bTime - aTime
  })
}

export function parseIgnNews(html) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const articles = []

  readContentItemArticles(document, articles)
  readJsonLdArticles(document, articles)
  readNextDataArticles(document, articles)
  readAnchorArticles(document, articles)

  return sortArticles(articles).slice(0, MAX_ARTICLES)
}

export async function fetchTextWithTimeout(url) {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`News source failed with ${response.status}`)
    }

    return response.text()
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export async function fetchIgnArticles() {
  const html = await fetchTextWithTimeout(IGN_GAME_URL)
  const articles = parseIgnNews(html)
  if (articles.length) return articles
  throw new Error('IGN news unavailable')
}

export function newsRouteFromIgnUrl(url) {
  const absoluteUrl = absoluteIgnUrl(url)
  if (!absoluteUrl) return ''

  try {
    const { pathname } = new URL(absoluteUrl)
    const match = pathname.match(/^\/(?:articles|videos)\/([^/?#]+)/)
    return match ? `/news/${match[1]}` : ''
  } catch {
    return ''
  }
}

export function ignTypeFromUrl(url) {
  const absoluteUrl = absoluteIgnUrl(url)
  if (!absoluteUrl) return 'article'

  try {
    const { pathname } = new URL(absoluteUrl)
    return pathname.startsWith('/videos/') ? 'video' : 'article'
  } catch {
    return 'article'
  }
}

export function sourceUrlForNewsSlug(slug, type = 'article') {
  const cleanSlug = String(slug || '').trim().toLowerCase()
  const collection = type === 'video' ? 'videos' : 'articles'
  return `${IGN_ORIGIN}/${collection}/${cleanSlug}`
}

function decodeHtml(value = '') {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = value
    return textarea.value
  }

  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function tagAttribute(tag = '', name) {
  const match = tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, 'i'))
  return decodeHtml(match?.[1] || match?.[2] || '')
}

function stripHtml(value = '') {
  return decodeHtml(String(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function absoluteContentUrl(url) {
  if (!url) return ''

  try {
    return new URL(decodeHtml(url), IGN_ORIGIN).toString()
  } catch {
    return ''
  }
}

function titleFromSlug(slug = '') {
  const acronyms = new Set(['gta', 'ign', 'p2p', 'pc', 'ps4', 'ps5', 'rdr', 'usdt', 'vi'])
  const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the', 'to', 'with'])

  return stripText(slug)
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

function inlineSegments(innerHtml = '') {
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
    const url = absoluteContentUrl(tagAttribute(match[1], 'href'))
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

function parseContentBlocks(processedHtml = '') {
  const blocks = []
  const blockPattern = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>|<section\b([^>]*)>(?:<\/section>)?/gi
  let match

  while ((match = blockPattern.exec(processedHtml))) {
    if (match[1] !== undefined) {
      const segments = inlineSegments(match[1])
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

function articleFromNextPage(page, sourceUrl) {
  if (!page) return null

  const schema = Array.isArray(page.schema) ? page.schema.find((entry) => {
    const type = Array.isArray(entry?.['@type']) ? entry['@type'] : [entry?.['@type']]
    return type.some((item) => ['Article', 'NewsArticle', 'VideoObject'].includes(item))
  }) : null
  const author = Array.isArray(page.contributors) && page.contributors.length
    ? page.contributors.map((contributor) => contributor.name).filter(Boolean).join(', ')
    : schema?.author?.name
  const image = page.image || page.feedImage?.url || (Array.isArray(schema?.image) ? schema.image[0] : schema?.image) || ''
  const blocks = parseContentBlocks(page.processedHtml || '')

  return {
    id: page.id || page.articleId || articleId(sourceUrl, page.pageTitle || page.feedTitle || page.title),
    slug: page.slug || '',
    title: cleanTitle(page.pageTitle || page.feedTitle || schema?.headline || page.title || ''),
    description: cleanSummary(page.description || page.excerpt || schema?.description || ''),
    author: stripText(author || 'IGN'),
    source: 'IGN',
    sourceUrl: sourceUrl || absoluteIgnUrl(page.url || page.canonical),
    publishedAt: normalizeDate(page.publishDate || schema?.datePublished),
    updatedAt: normalizeDate(page.updatedAt || schema?.dateModified),
    image: absoluteContentUrl(image),
    blocks,
  }
}

export function parseIgnArticle(html, sourceUrl) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const nextData = document.querySelector('#__NEXT_DATA__')?.textContent

  if (nextData) {
    try {
      const parsed = JSON.parse(nextData)
      const page = parsed?.props?.pageProps?.page
      const article = articleFromNextPage(page, sourceUrl)
      if (article?.title && article.blocks?.length) return article
    } catch {
      // Fall through to document parsing.
    }
  }

  const title = cleanTitle(
    document.querySelector('[data-cy="article-headline"]')?.textContent ||
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    document.title,
  )
  const description = cleanSummary(
    document.querySelector('[data-cy="article-sub-headline"]')?.textContent ||
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
  )
  const content = document.querySelector('[data-cy="article-content"]')
  const blocks = content
    ? Array.from(content.querySelectorAll('[data-cy="paragraph"]')).map((paragraph) => ({
      type: 'paragraph',
      text: stripText(paragraph.textContent),
      segments: [{ type: 'text', text: stripText(paragraph.textContent) }],
    })).filter((block) => block.text)
    : []

  return {
    id: articleId(sourceUrl, title),
    slug: '',
    title,
    description,
    author: stripText(document.querySelector('[data-cy="article-author"]')?.textContent || document.querySelector('meta[property="article:author"]')?.getAttribute('content') || 'IGN'),
    source: 'IGN',
    sourceUrl,
    publishedAt: normalizeDate(document.querySelector('meta[property="article:published_time"]')?.getAttribute('content')),
    updatedAt: normalizeDate(document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')),
    image: absoluteContentUrl(document.querySelector('meta[property="og:image"]')?.getAttribute('content')),
    blocks,
  }
}

export async function fetchIgnArticleBySlug(slug, type = 'article') {
  const cleanSlug = String(slug || '').trim().toLowerCase()
  const requestTypes = type === 'video' ? ['video'] : ['article', 'video']
  let firstError = null

  const fetchFromApi = async (requestType) => {
    const query = new URLSearchParams({ slug: cleanSlug, type: requestType })
    const response = await fetch(`/api/news/article?${query.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const payload = await response.json()

    if (!response.ok) throw new Error(payload?.error || `News article API failed with ${response.status}`)
    if (payload?.article?.title) return payload.article
    throw new Error('News article API returned an empty article.')
  }

  const fetchDirectly = async (requestType) => {
    const sourceUrl = sourceUrlForNewsSlug(cleanSlug, requestType)
    const html = await fetchTextWithTimeout(sourceUrl)
    const article = parseIgnArticle(html, sourceUrl)
    if (article?.title && article.blocks?.length) return article
    throw new Error('IGN article source returned an empty article.')
  }

  for (const requestType of requestTypes) {
    try {
      return await fetchFromApi(requestType)
    } catch (error) {
      firstError ||= error
    }
  }

  for (const requestType of requestTypes) {
    try {
      return await fetchDirectly(requestType)
    } catch (error) {
      firstError ||= error
    }
  }

  throw firstError || new Error('Unable to load this IGN article.')
}

export function formatTimeAgo(value, t) {
  if (!value) return 'IGN'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'IGN'

  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  const intervals = [
    { key: 'year', seconds: 31536000 },
    { key: 'month', seconds: 2592000 },
    { key: 'week', seconds: 604800 },
    { key: 'day', seconds: 86400 },
    { key: 'hour', seconds: 3600 },
    { key: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      const label = t.news.timeAgo[interval.key]
      return `${count} ${label}${count > 1 && !['zh','ru','pl','hi','ms','id'].includes('') ? 's' : ''} ago`
    }
  }

  return t.news.justNow
}
