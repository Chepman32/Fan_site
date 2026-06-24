import { useEffect, useMemo, useState } from 'react'
import { Loader, ArrowUpRight, Clock, UserRound } from 'lucide-react'
import {
  newsTranslationSource,
  translateNewsArticles,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import {
  FALLBACK_NEWS,
  INITIAL_ARTICLE_COUNT,
  fetchIgnArticles,
  formatTimeAgo,
  newsRouteFromIgnUrl,
} from '../news/ignNews'
import './NewsSection.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function NewsSection({ onNavigate }) {
  const { t, lang } = useTranslation()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const translationSource = useMemo(() => newsTranslationSource(articles), [articles])
  const { data: displayArticles } = useTranslatedIgnContent(articles, {
    enabled: !loading && articles.length > 0,
    lang,
    scope: 'news',
    source: translationSource,
    translate: translateNewsArticles,
  })

  const visibleArticles = showAll ? displayArticles : displayArticles.slice(0, INITIAL_ARTICLE_COUNT)
  const hasMoreArticles = displayArticles.length > INITIAL_ARTICLE_COUNT

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
          <h1 className="section-title">
            {t.news.title} <span className="gradient-text">{t.news.titleHighlight}</span>
          </h1>
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
              {visibleArticles.map((article, index) => {
                const localNewsRoute = newsRouteFromIgnUrl(article.url)
                const href = localNewsRoute || article.url

                return (
                  <a
                    key={article.id || article.url}
                    href={href}
                    target={localNewsRoute ? undefined : '_blank'}
                    rel={localNewsRoute ? undefined : 'noopener noreferrer'}
                    className="news-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={(event) => {
                      if (!localNewsRoute || !onNavigate || !isPlainLeftClick(event)) return
                      event.preventDefault()
                      onNavigate(localNewsRoute)
                    }}
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
                )
              })}
            </div>

            {hasMoreArticles && (
              <div className="news-actions">
                <span className="news-count">
                  {t.news.showing} {visibleArticles.length} {t.news.of} {displayArticles.length}
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
