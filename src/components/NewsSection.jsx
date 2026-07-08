import { useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Newspaper, Tag } from 'lucide-react'
import { newsArticles } from '../content/news'
import './NewsSection.css'

const INITIAL_ARTICLE_COUNT = 4

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function NewsSection({ onNavigate }) {
  const [showAll, setShowAll] = useState(false)
  const featuredArticle = newsArticles[0]
  const visibleArticles = showAll ? newsArticles : newsArticles.slice(0, INITIAL_ARTICLE_COUNT)
  const categories = Array.from(new Set(newsArticles.map((article) => article.category)))

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <section id="news" className="section-padding news-section">
      <div className="container news-shell">
        <header className="news-page-header">
          <span><Newspaper size={15} /> GTA VI updates</span>
          <h1>GTA VI News</h1>
          <p>
            Follow GTA VI release updates, Rockstar announcements, trailer analysis, Leonida map
            details, characters, vehicles, weapons, and platform news from one static news hub.
          </p>
          <nav aria-label="News hub links">
            <a href="/about" onClick={(event) => navigate(event, '/about')}>About GTA VI</a>
            <a href="/leonida" onClick={(event) => navigate(event, '/leonida')}>Leonida guide</a>
            <a href="/community" onClick={(event) => navigate(event, '/community')}>Community</a>
            <a href="/shop" onClick={(event) => navigate(event, '/shop')}>Creator shop</a>
          </nav>
        </header>

        <section className="news-featured" aria-labelledby="featured-news-title">
          <div>
            <span>Featured article</span>
            <h2 id="featured-news-title">{featuredArticle.title}</h2>
            <p>{featuredArticle.description}</p>
            <div className="news-featured-meta">
              <span><CalendarDays size={14} /> Updated {formatDate(featuredArticle.updatedAt)}</span>
              <span><Tag size={14} /> {featuredArticle.category}</span>
            </div>
            <a href={`/news/${featuredArticle.slug}`} onClick={(event) => navigate(event, `/news/${featuredArticle.slug}`)}>
              Read featured article
              <ArrowRight size={16} />
            </a>
          </div>
          <img src={featuredArticle.image || '/og-image.png'} alt="" aria-hidden="true" loading="eager" decoding="async" />
        </section>

        <section className="news-confirmed" aria-labelledby="confirmed-updates-title">
          <header>
            <span>Latest confirmed updates</span>
            <h2 id="confirmed-updates-title">Latest confirmed updates</h2>
          </header>
          <div className="news-confirmed-grid">
            {newsArticles.map((article) => (
              <article key={article.slug}>
                <strong>{article.title}</strong>
                <p>{article.description}</p>
                <small><Clock size={13} /> Last updated {formatDate(article.updatedAt)}</small>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="article-list-title">
          <header className="news-list-heading">
            <div>
              <span>Article cards</span>
              <h2 id="article-list-title">GTA VI article list</h2>
            </div>
            <div className="news-category-list" aria-label="News categories">
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
                    <span className="news-source">Leonida Loot</span>
                    <span className="news-time">
                      <Clock size={12} />
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>

                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-summary">{article.description}</p>

                  <div className="news-footer">
                    <span className="news-stat">
                      <ArrowRight size={14} />
                      Read article
                    </span>
                    <span className="news-author">{article.category}</span>
                  </div>
                </a>
              )
            })}
          </div>

          {newsArticles.length > INITIAL_ARTICLE_COUNT && (
            <div className="news-actions">
              <span className="news-count">
                Showing {visibleArticles.length} of {newsArticles.length}
              </span>
              <button type="button" className="show-more-button" onClick={() => setShowAll((current) => !current)}>
                {showAll ? 'Show fewer' : 'Show more'}
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default NewsSection
