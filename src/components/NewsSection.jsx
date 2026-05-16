import { useEffect, useState } from 'react'
import { Loader, ArrowUpRight, Clock, UserRound } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './NewsSection.css'

const IGN_GAME_URL = 'https://www.ign.com/games/grand-theft-auto-vi'
const IGN_ORIGIN = 'https://www.ign.com'
const MAX_ARTICLES = 80
const INITIAL_ARTICLE_COUNT = 6
const FETCH_TIMEOUT_MS = 10000

const FALLBACK_NEWS = [
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

function absoluteIgnUrl(url) {
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

function articleId(url, title) {
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

function parseIgnNews(html) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const articles = []

  readContentItemArticles(document, articles)
  readJsonLdArticles(document, articles)
  readNextDataArticles(document, articles)
  readAnchorArticles(document, articles)

  return sortArticles(articles).slice(0, MAX_ARTICLES)
}

async function fetchTextWithTimeout(url) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

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
    window.clearTimeout(timeoutId)
  }
}

async function fetchIgnArticles() {
  const html = await fetchTextWithTimeout(IGN_GAME_URL)
  const articles = parseIgnNews(html)
  if (articles.length) return articles
  throw new Error('IGN news unavailable')
}

function formatTimeAgo(value, t) {
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

function NewsSection() {
  const { t } = useTranslation()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const visibleArticles = showAll ? articles : articles.slice(0, INITIAL_ARTICLE_COUNT)
  const hasMoreArticles = articles.length > INITIAL_ARTICLE_COUNT

  useEffect(() => {
    let canceled = false

    const fetchIgnNews = async () => {
      try {
        setLoading(true)
        const nextArticles = await fetchIgnArticles()
        if (!canceled) setArticles(nextArticles)
      } catch (error) {
        console.log('IGN news fetch failed, using fallback:', error)
        if (!canceled) setArticles(FALLBACK_NEWS)
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchIgnNews()

    return () => { canceled = true }
  }, [])

  return (
    <section id="news" className="section-padding news-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {t.news.title} <span className="gradient-text">{t.news.titleHighlight}</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{t.news.loading}</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="news-grid">
              {visibleArticles.map((article, index) => (
                <a
                  key={article.id || article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="news-header">
                    <span className="news-source">{article.source || 'IGN'}</span>
                    <span className="news-time">
                      <Clock size={12} />
                      {formatTimeAgo(article.publishedAt, t)}
                    </span>
                  </div>

                  <h3 className="news-title">{article.title}</h3>
                  {article.summary && <p className="news-summary">{article.summary}</p>}

                  <div className="news-footer">
                    <div className="news-stats">
                      <span className="news-stat">
                        <ArrowUpRight size={14} />
                        {article.type || 'Article'}
                      </span>
                    </div>
                    <span className="news-author">
                      <UserRound size={13} />
                      {article.author || 'IGN'}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {hasMoreArticles && (
              <div className="news-actions">
                <span className="news-count">
                  {t.news.showing} {visibleArticles.length} {t.news.of} {articles.length}
                </span>
                <button type="button" className="show-more-button" onClick={() => setShowAll((c) => !c)}>
                  {showAll ? t.news.showLess : t.news.showMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default NewsSection
