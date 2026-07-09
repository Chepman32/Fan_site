import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock, ExternalLink, Image as ImageIcon, Loader, PlayCircle, UserRound } from 'lucide-react'
import {
  fetchIgnArticleBySlug,
  newsRouteFromIgnUrl,
  sourceUrlForNewsSlug,
} from '../news/ignNews'
import { getNewsArticle } from '../content/news'
import {
  newsArticleTranslationSource,
  translateNewsArticle,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './NewsArticlePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

const DATE_LOCALES = {
  zh: 'zh-CN',
  hi: 'hi-IN',
  ms: 'ms-MY',
}

function dateLocale(lang) {
  return DATE_LOCALES[lang] || lang || undefined
}

function formatDate(value, lang) {
  if (!value) return 'IGN'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'IGN'

  return new Intl.DateTimeFormat(dateLocale(lang), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function titleFromSlug(slug = '') {
  const acronyms = new Set(['gta', 'ign', 'pc', 'ps5', 'rdr', 'vi'])
  const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the', 'to', 'with'])

  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part, index) => {
      if (acronyms.has(part)) return part.toUpperCase()
      if (index > 0 && lowercaseWords.has(part)) return part
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    })
    .join(' ')
}

function fallbackArticleForSlug(slug, type, sourceUrl) {
  const title = titleFromSlug(slug) || 'GTA VI News Article'

  return {
    id: `fallback-${slug}`,
    slug,
    title,
    description: `${title} coverage for Grand Theft Auto VI, with source attribution and clearly separated public context.`,
    author: 'Leonida Loot',
    source: 'Leonida Loot',
    sourceUrl,
    publishedAt: '',
    updatedAt: '2026-07-07T00:00:00.000Z',
    image: '',
    blocks: [
      {
        type: 'paragraph',
        text: `This article page is reserved for ${title}. Leonida Loot loads source coverage in the browser when available and keeps this fallback readable for crawlers and visitors.`,
        segments: [{ type: 'text', text: `This article page is reserved for ${title}. Leonida Loot loads source coverage in the browser when available and keeps this fallback readable for crawlers and visitors.` }],
      },
      {
        type: 'paragraph',
        text: 'For GTA VI news, the site separates official announcements, reputable source coverage, rumor tracking, and fan analysis so readers can understand what is confirmed.',
        segments: [{ type: 'text', text: 'For GTA VI news, the site separates official announcements, reputable source coverage, rumor tracking, and fan analysis so readers can understand what is confirmed.' }],
      },
      {
        type: type === 'video' ? 'video' : 'gallery',
        title,
        sourceUrl,
      },
    ],
  }
}

function staticArticleToPage(article) {
  if (!article) return null

  return {
    id: `static-${article.slug}`,
    slug: article.slug,
    title: article.title,
    description: article.description,
    author: article.author || 'Leonida Loot Editorial',
    source: 'Leonida Loot',
    sourceUrl: article.sources?.[0]?.url || '/news',
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    image: article.image,
    blocks: [
      ...(article.body || []).flatMap((section) => [
        {
          type: 'heading',
          text: section.heading,
        },
        ...(section.paragraphs || []).map((paragraph) => ({
          type: 'paragraph',
          text: paragraph,
          segments: [{ type: 'text', text: paragraph }],
        })),
      ]),
      {
        type: 'sources',
        sources: article.sources || [],
      },
    ],
  }
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function InlineSegment({ segment, onNavigate }) {
  if (segment.type !== 'link') return segment.text

  const localRoute = newsRouteFromIgnUrl(segment.url)
  const href = localRoute || segment.url

  return (
    <a
      href={href}
      target={localRoute ? undefined : '_blank'}
      rel={localRoute ? undefined : 'noopener noreferrer'}
      onClick={(event) => localRoute && navigateInternally(event, localRoute, onNavigate)}
    >
      {segment.text}
    </a>
  )
}

function ParagraphBlock({ block, onNavigate }) {
  const segments = Array.isArray(block.segments) && block.segments.length
    ? block.segments
    : [{ type: 'text', text: block.text }]

  return (
    <p>
      {segments.map((segment, index) => (
        <span key={`${segment.type}-${segment.text}-${index}`}>
          {index > 0 ? ' ' : ''}
          <InlineSegment segment={segment} onNavigate={onNavigate} />
        </span>
      ))}
    </p>
  )
}

function MediaBlock({ block, copy }) {
  const isVideo = block.type === 'video'
  const Icon = isVideo ? PlayCircle : ImageIcon
  const label = isVideo ? copy.videoLabel : copy.galleryLabel

  return (
    <aside className="news-article-media-callout">
      <Icon size={24} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{block.title}</strong>
      </div>
      {block.sourceUrl && (
        <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.openOnIgn(block.title)}>
          <ExternalLink size={17} aria-hidden="true" />
        </a>
      )}
    </aside>
  )
}

function ArticleBlock({ block, onNavigate, copy }) {
  if (block.type === 'heading') return <h2>{block.text}</h2>
  if (block.type === 'paragraph') return <ParagraphBlock block={block} onNavigate={onNavigate} />
  if (block.type === 'gallery' || block.type === 'video') return <MediaBlock block={block} copy={copy} />
  if (block.type === 'sources' && block.sources?.length) {
    return (
      <aside className="news-article-sources">
        <h2>{copy.sources}</h2>
        <ul>
          {block.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </aside>
    )
  }
  if (block.type === 'image' && block.url) {
    return (
      <figure className="news-article-inline-image">
        <img src={block.url} alt={block.alt || block.title || ''} loading="lazy" />
        {(block.caption || block.title) && <figcaption>{block.caption || block.title}</figcaption>}
      </figure>
    )
  }
  return null
}

function NewsArticlePage({ slug, type = 'article', onNavigate }) {
  const { t, lang } = useTranslation()
  const copy = t.news?.article || {}
  const articleCopy = {
    backToNews: copy.backToNews || 'Back to news',
    galleryLabel: copy.galleryLabel || 'IGN gallery',
    imageViaIgn: copy.imageViaIgn || 'Image via IGN',
    kicker: copy.kicker || 'IGN coverage',
    loading: copy.loading || 'Preparing news article',
    openOnIgn: copy.openOnIgn || ((title) => `Open ${title} on IGN`),
    openSourceOnIgn: copy.openSourceOnIgn || 'Open source on IGN',
    parsedUnavailable: copy.parsedUnavailable || 'The article could not be parsed yet.',
    source: copy.source || 'Source',
    sourceRefreshUnavailable: copy.sourceRefreshUnavailable || ((message) => `Source refresh unavailable: ${message}`),
    sources: copy.sources || 'Sources',
    unavailable: copy.unavailable || 'News article unavailable',
    videoLabel: copy.videoLabel || 'IGN video',
  }
  const staticArticle = useMemo(() => getNewsArticle(slug), [slug])
  const staticPageArticle = useMemo(() => staticArticleToPage(staticArticle), [staticArticle])
  const fallbackSourceUrl = useMemo(() => sourceUrlForNewsSlug(slug, type), [slug, type])
  const [remoteArticle, setRemoteArticle] = useState(() => fallbackArticleForSlug(slug, type, fallbackSourceUrl))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const article = staticPageArticle || remoteArticle
  const translationSource = useMemo(
    () => (article ? newsArticleTranslationSource(article) : null),
    [article],
  )
  const { data: displayArticle } = useTranslatedIgnContent(article, {
    enabled: !loading && Boolean(article),
    lang,
    scope: `news-article-${slug}`,
    source: translationSource,
    translate: translateNewsArticle,
  })

  useEffect(() => {
    if (staticArticle) return undefined

    let canceled = false

    const loadArticle = async () => {
      try {
        setError('')
        const nextArticle = await fetchIgnArticleBySlug(slug, type)
        if (!canceled) setRemoteArticle(nextArticle)
      } catch (nextError) {
        console.log('IGN article fetch failed:', nextError)
        if (!canceled) {
          setRemoteArticle(fallbackArticleForSlug(slug, type, fallbackSourceUrl))
          setError(nextError.message || 'Unable to load this IGN article.')
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadArticle()

    return () => { canceled = true }
  }, [fallbackSourceUrl, slug, staticArticle, type])

  useEffect(() => {
    if (!displayArticle?.title) return undefined

    document.title = `${displayArticle.title} | Leonida Loot`

    const description = displayArticle.description || `${displayArticle.title} on Leonida Loot.`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description)

    return undefined
  }, [displayArticle])

  if (loading) {
    return (
      <section className="section-padding news-article-page">
        <div className="container news-article-shell">
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{articleCopy.loading}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!displayArticle) {
    return (
      <section className="section-padding news-article-page">
        <div className="container news-article-shell">
          <a href="/news" className="news-article-back" onClick={(event) => navigateInternally(event, '/news', onNavigate)}>
            <ArrowLeft size={16} aria-hidden="true" />
            {articleCopy.backToNews}
          </a>
          <div className="news-article-empty">
            <h1>{articleCopy.unavailable}</h1>
            <p>{articleCopy.parsedUnavailable}</p>
            <a href={fallbackSourceUrl} target="_blank" rel="noopener noreferrer">
              {articleCopy.openSourceOnIgn}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding news-article-page">
      <article className="container news-article-shell">
        <a href="/news" className="news-article-back" onClick={(event) => navigateInternally(event, '/news', onNavigate)}>
          <ArrowLeft size={16} aria-hidden="true" />
          {articleCopy.backToNews}
        </a>

        <header className="news-article-hero">
          <div className="news-article-kicker">{articleCopy.kicker}</div>
          <h1>{displayArticle.title}</h1>
          {displayArticle.description && <p className="news-article-dek">{displayArticle.description}</p>}
          <div className="news-article-meta">
            <span>
              <UserRound size={15} aria-hidden="true" />
              {displayArticle.author || 'IGN'}
            </span>
            <span>
              <Clock size={15} aria-hidden="true" />
              {formatDate(displayArticle.publishedAt || displayArticle.updatedAt, lang)}
            </span>
            <a href={displayArticle.sourceUrl || fallbackSourceUrl} target="_blank" rel="noopener noreferrer">
              {articleCopy.source}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </header>

        {!staticArticle && error && <p className="news-article-source-note">{articleCopy.sourceRefreshUnavailable(error)}</p>}

        {displayArticle.image && (
          <figure className="news-article-cover">
            <img src={displayArticle.image} alt="" loading="eager" />
            <figcaption>{articleCopy.imageViaIgn}</figcaption>
          </figure>
        )}

        <div className="news-article-body">
          {(displayArticle.blocks || []).map((block, index) => (
            <ArticleBlock key={`${block.type}-${index}`} block={block} onNavigate={onNavigate} copy={articleCopy} />
          ))}
        </div>
      </article>
    </section>
  )
}

export default NewsArticlePage
