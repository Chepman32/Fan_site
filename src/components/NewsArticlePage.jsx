import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock, ExternalLink, Image as ImageIcon, Loader, PlayCircle, UserRound } from 'lucide-react'
import {
  fetchIgnArticleBySlug,
  newsRouteFromIgnUrl,
  sourceUrlForNewsSlug,
} from '../news/ignNews'
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

function formatDate(value) {
  if (!value) return 'IGN'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'IGN'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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

function MediaBlock({ block }) {
  const isVideo = block.type === 'video'
  const Icon = isVideo ? PlayCircle : ImageIcon
  const label = isVideo ? 'IGN video' : 'IGN gallery'

  return (
    <aside className="news-article-media-callout">
      <Icon size={24} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{block.title}</strong>
      </div>
      {block.sourceUrl && (
        <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${block.title} on IGN`}>
          <ExternalLink size={17} aria-hidden="true" />
        </a>
      )}
    </aside>
  )
}

function ArticleBlock({ block, onNavigate }) {
  if (block.type === 'paragraph') return <ParagraphBlock block={block} onNavigate={onNavigate} />
  if (block.type === 'gallery' || block.type === 'video') return <MediaBlock block={block} />
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
  const { lang } = useTranslation()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fallbackSourceUrl = useMemo(() => sourceUrlForNewsSlug(slug, type), [slug, type])
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
    let canceled = false

    const loadArticle = async () => {
      try {
        setLoading(true)
        setError('')
        const nextArticle = await fetchIgnArticleBySlug(slug, type)
        if (!canceled) setArticle(nextArticle)
      } catch (nextError) {
        console.log('IGN article fetch failed:', nextError)
        if (!canceled) {
          setArticle(null)
          setError(nextError.message || 'Unable to load this IGN article.')
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadArticle()

    return () => { canceled = true }
  }, [slug, type])

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
            <p>Loading news article...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error || !displayArticle) {
    return (
      <section className="section-padding news-article-page">
        <div className="container news-article-shell">
          <a href="/news" className="news-article-back" onClick={(event) => navigateInternally(event, '/news', onNavigate)}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to news
          </a>
          <div className="news-article-empty">
            <h1>News article unavailable</h1>
            <p>{error || 'The article could not be parsed yet.'}</p>
            <a href={fallbackSourceUrl} target="_blank" rel="noopener noreferrer">
              Open source on IGN
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
          Back to news
        </a>

        <header className="news-article-hero">
          <div className="news-article-kicker">IGN coverage</div>
          <h1>{displayArticle.title}</h1>
          {displayArticle.description && <p className="news-article-dek">{displayArticle.description}</p>}
          <div className="news-article-meta">
            <span>
              <UserRound size={15} aria-hidden="true" />
              {displayArticle.author || 'IGN'}
            </span>
            <span>
              <Clock size={15} aria-hidden="true" />
              {formatDate(displayArticle.publishedAt || displayArticle.updatedAt)}
            </span>
            <a href={displayArticle.sourceUrl || fallbackSourceUrl} target="_blank" rel="noopener noreferrer">
              Source
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </header>

        {displayArticle.image && (
          <figure className="news-article-cover">
            <img src={displayArticle.image} alt="" loading="eager" />
            <figcaption>Image via IGN</figcaption>
          </figure>
        )}

        <div className="news-article-body">
          {(displayArticle.blocks || []).map((block, index) => (
            <ArticleBlock key={`${block.type}-${index}`} block={block} onNavigate={onNavigate} />
          ))}
        </div>
      </article>
    </section>
  )
}

export default NewsArticlePage
