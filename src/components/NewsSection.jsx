import { useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Newspaper, Tag } from 'lucide-react'
import { newsArticles } from '../content/news'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './NewsSection.css'

const INITIAL_ARTICLE_COUNT = 4
const DATE_LOCALES = {
  zh: 'zh-CN',
  hi: 'hi-IN',
  ms: 'ms-MY',
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function dateLocale(lang) {
  return DATE_LOCALES[lang] || lang || undefined
}

function formatDate(value, lang) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(dateLocale(lang), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function localizedArticle(article, newsCopy) {
  const articleCopy = newsCopy.articles?.[article.slug] || {}
  const categoryLabel = newsCopy.categoryLabels?.[article.category] || articleCopy.category || article.category

  return {
    ...article,
    ...articleCopy,
    categoryLabel,
  }
}

function NewsSection({ onNavigate }) {
  const { t, lang } = useTranslation()
  const newsCopy = t.news || {}
  const [showAll, setShowAll] = useState(false)
  const localizedArticles = newsArticles.map((article) => localizedArticle(article, newsCopy))
  const featuredArticle = localizedArticles[0]
  const visibleArticles = showAll ? localizedArticles : localizedArticles.slice(0, INITIAL_ARTICLE_COUNT)
  const categories = Array.from(new Set(localizedArticles.map((article) => article.categoryLabel)))
  const showingCount = typeof newsCopy.showingCount === 'function'
    ? newsCopy.showingCount(visibleArticles.length, localizedArticles.length)
    : `${newsCopy.showing || 'Showing'} ${visibleArticles.length} ${newsCopy.of || 'of'} ${localizedArticles.length}`

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <section id="news" className="section-padding news-section">
      <div className="container news-shell">
        <header className="news-page-header">
          <span><Newspaper size={15} /> {newsCopy.pageBadge || 'GTA VI updates'}</span>
          <h1>{newsCopy.pageTitle || 'GTA VI News'}</h1>
          <p>{newsCopy.pageDescription}</p>
          <nav aria-label={newsCopy.linksLabel || 'News hub links'}>
            <a href="/about" onClick={(event) => navigate(event, '/about')}>{newsCopy.links?.about || t.nav.about}</a>
            <a href="/leonida" onClick={(event) => navigate(event, '/leonida')}>{newsCopy.links?.leonida || t.nav.leonida}</a>
            <a href="/community" onClick={(event) => navigate(event, '/community')}>{newsCopy.links?.community || t.nav.community || t.nav.social}</a>
            <a href="/shop" onClick={(event) => navigate(event, '/shop')}>{newsCopy.links?.shop || t.nav.shop}</a>
          </nav>
        </header>

        <section className="news-featured" aria-labelledby="featured-news-title">
          <div>
            <span>{newsCopy.featuredLabel || 'Featured article'}</span>
            <h2 id="featured-news-title">{featuredArticle.title}</h2>
            <p>{featuredArticle.description}</p>
            <div className="news-featured-meta">
              <span><CalendarDays size={14} /> {newsCopy.updatedLabel || 'Updated'} {formatDate(featuredArticle.updatedAt, lang)}</span>
              <span><Tag size={14} /> {featuredArticle.categoryLabel}</span>
            </div>
            <a href={`/news/${featuredArticle.slug}`} onClick={(event) => navigate(event, `/news/${featuredArticle.slug}`)}>
              {newsCopy.readFeatured || 'Read featured article'}
              <ArrowRight size={16} />
            </a>
          </div>
          <img src={featuredArticle.image || '/og-image.png'} alt="" aria-hidden="true" loading="eager" decoding="async" />
        </section>

        <section className="news-confirmed" aria-labelledby="confirmed-updates-title">
          <header>
            <span>{newsCopy.confirmedKicker || 'Latest confirmed updates'}</span>
            <h2 id="confirmed-updates-title">{newsCopy.confirmedTitle || 'Latest confirmed updates'}</h2>
          </header>
          <div className="news-confirmed-grid">
            {localizedArticles.map((article) => (
              <article key={article.slug}>
                <strong>{article.title}</strong>
                <p>{article.description}</p>
                <small><Clock size={13} /> {newsCopy.lastUpdatedLabel || 'Last updated'} {formatDate(article.updatedAt, lang)}</small>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="article-list-title">
          <header className="news-list-heading">
            <div>
              <span>{newsCopy.listKicker || 'Article cards'}</span>
              <h2 id="article-list-title">{newsCopy.listTitle || 'GTA VI article list'}</h2>
            </div>
            <div className="news-category-list" aria-label={newsCopy.categoriesLabel || 'News categories'}>
              {categories.map((category) => <span key={category}>{category}</span>)}
            </div>
          </header>

          <div className="news-grid">
            {visibleArticles.map((article, index) => {
              const href = `/news/${article.slug}`

              return (
                <a
                  key={article.slug}
                  href={href}
                  className="news-card"
                  style={{ animationDelay: `${index * 0.06}s` }}
                  onClick={(event) => navigate(event, href)}
                >
                  <div className="news-header">
                    <span className="news-source">{newsCopy.sourceName || 'Leonida Loot'}</span>
                    <span className="news-time">
                      <Clock size={12} />
                      {formatDate(article.publishedAt, lang)}
                    </span>
                  </div>

                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-summary">{article.description}</p>

                  <div className="news-footer">
                    <span className="news-stat">
                      <ArrowRight size={14} />
                      {newsCopy.readArticle || 'Read article'}
                    </span>
                    <span className="news-author">{article.categoryLabel}</span>
                  </div>
                </a>
              )
            })}
          </div>

          {localizedArticles.length > INITIAL_ARTICLE_COUNT && (
            <div className="news-actions">
              <span className="news-count">{showingCount}</span>
              <button type="button" className="show-more-button" onClick={() => setShowAll((current) => !current)}>
                {showAll ? newsCopy.showLess || 'Show fewer' : newsCopy.showMore || 'Show more'}
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default NewsSection
