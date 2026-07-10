import {
  ArrowRight,
  BookOpenText,
  Car,
  Crosshair,
  MapPinned,
  MessageCircle,
  Newspaper,
  ShoppingBag,
  Store,
  UsersRound,
} from 'lucide-react'
import { useMemo } from 'react'
import { HOME_FEATURED_PRODUCTS } from '../content/homeFeaturedProducts'
import { newsArticles } from '../content/news'
import { SEO_GUIDES } from '../data/guideContent'
import { localizeLeonidaSections } from '../data/leonidaSections'
import {
  newsTranslationSource,
  translateNewsArticles,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { newsTranslations } from '../i18n/newsTranslations'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { formatShopPrice } from '../shop/paymentConfig'
import './HomePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

const DATE_LOCALES = {
  zh: 'zh-CN',
  hi: 'hi-IN',
  ms: 'ms-MY',
}

const HUB_LINKS = [
  { id: 'news', href: '/news', icon: Newspaper },
  { id: 'leonida', href: '/leonida', icon: BookOpenText },
  { id: 'characters', href: '/leonida/characters', icon: UsersRound },
  { id: 'locations', href: '/leonida/locations', icon: MapPinned },
  { id: 'vehicles', href: '/leonida/vehicles', icon: Car },
  { id: 'weapons', href: '/leonida/weapons', icon: Crosshair },
  { id: 'shop', href: '/shop', icon: ShoppingBag },
  { id: 'p2p', href: '/p2p', icon: Store },
  { id: 'community', href: '/community', icon: MessageCircle },
  { id: 'about', href: '/about', icon: BookOpenText },
]

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

function HomePage({ onNavigate }) {
  const { t, lang } = useTranslation()
  const homeCopy = t.home
  const newsCopy = useMemo(() => t.news || {}, [t.news])
  const shopCopy = { ...t.shop, lang }
  const hubLinks = HUB_LINKS.map((link) => ({
    ...link,
    ...(homeCopy.hubLinks?.[link.id] || {}),
  }))
  const featuredProducts = HOME_FEATURED_PRODUCTS.map((product) => ({
    ...product,
    title: shopCopy.productTitles?.[product.id] || shopCopy.productTitles?.[product.title] || product.title,
    categoryLabel: shopCopy.categories?.[product.categoryId] || product.categoryLabel,
  }))
  const fallbackNews = useMemo(
    () => newsArticles.slice(0, 3).map((article) => localizedArticle(article, newsCopy)),
    [newsCopy],
  )
  const englishNews = useMemo(
    () => newsArticles.slice(0, 3).map((article) => localizedArticle(article, newsTranslations.en)),
    [],
  )
  const newsTranslationPayload = useMemo(() => newsTranslationSource(englishNews), [englishNews])
  const { data: googleTranslatedNews, translated: hasGoogleTranslatedNews } = useTranslatedIgnContent(englishNews, {
    enabled: lang !== 'en',
    lang,
    scope: 'home-featured-news',
    source: newsTranslationPayload,
    translate: translateNewsArticles,
  })
  const featuredNews = lang === 'en' || hasGoogleTranslatedNews ? googleTranslatedNews : fallbackNews
  const leonidaSections = localizeLeonidaSections(t.leonidaHub)

  const navigate = (event, href) => {
    if (!href.startsWith('/') || !onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <img
          src="/images/leonida/locations-day.webp"
          srcSet="/images/leonida/locations-day-800.webp 800w, /images/leonida/locations-day-960.webp 960w, /images/leonida/locations-day-1200.webp 1200w, /images/leonida/locations-day.webp 1600w"
          sizes="100vw"
          alt=""
          className="home-hero-image"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width="1600"
          height="900"
        />
        <div className="home-hero-scrim" aria-hidden="true" />
        <div className="container home-hero-inner">
          <h1>{homeCopy.hero.title}</h1>
          <p>{homeCopy.hero.description}</p>
          <div className="home-hero-actions">
            <a href="/news" onClick={(event) => navigate(event, '/news')}>
              {homeCopy.hero.ctas.news}
              <ArrowRight size={17} />
            </a>
            <a href="/leonida" onClick={(event) => navigate(event, '/leonida')}>
              {homeCopy.hero.ctas.leonida}
              <MapPinned size={17} />
            </a>
            <a href="/shop" onClick={(event) => navigate(event, '/shop')}>
              {homeCopy.hero.ctas.shop}
              <ShoppingBag size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>{homeCopy.news.kicker}</span>
              <h2>{homeCopy.news.title}</h2>
            </div>
            <p>{homeCopy.news.description}</p>
          </header>

          <div className="home-news-grid">
            {featuredNews.map((article) => (
              <a key={article.slug} href={`/news/${article.slug}`} onClick={(event) => navigate(event, `/news/${article.slug}`)}>
                <span>{article.categoryLabel}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <small>{newsCopy.updatedLabel || 'Updated'} {formatDate(article.updatedAt, lang)}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>{homeCopy.start.kicker}</span>
              <h2>{homeCopy.start.title}</h2>
            </div>
            <p>{homeCopy.start.description}</p>
          </header>

          <div className="home-hub-grid">
            {hubLinks.map((link) => {
              const Icon = link.icon

              return (
                <a key={link.href} className="home-hub-card" href={link.href} onClick={(event) => navigate(event, link.href)}>
                  <span><Icon size={19} /></span>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                  <strong>
                    {homeCopy.start.cardCta}
                    <ArrowRight size={15} />
                  </strong>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-padding home-section home-guides-band">
        <div className="container home-split">
          <div>
            <span className="home-kicker">{homeCopy.guides.kicker}</span>
            <h2>{homeCopy.guides.title}</h2>
            <p>{homeCopy.guides.description}</p>
            <a className="home-inline-link" href="/guides" onClick={(event) => navigate(event, '/guides')}>
              {homeCopy.guides.cta}
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="home-guide-list">
            {SEO_GUIDES.slice(0, 4).map((guide) => {
              const guideCopy = homeCopy.guideCards?.[guide.slug] || guide

              return (
                <a key={guide.slug} href={`/guides/${guide.slug}`} onClick={(event) => navigate(event, `/guides/${guide.slug}`)}>
                  <strong>{guideCopy.title}</strong>
                  <span>{guideCopy.summary}</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>{homeCopy.leonida.kicker}</span>
              <h2>{homeCopy.leonida.title}</h2>
            </div>
            <p>{homeCopy.leonida.description}</p>
          </header>

          <div className="home-leonida-grid">
            {leonidaSections.map((section) => (
              <a key={section.id} href={section.href} onClick={(event) => navigate(event, section.href)}>
                <img src={section.image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <span>{section.shortTitle}</span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding home-section home-market-band">
        <div className="container home-commerce-grid">
          <div>
            <span className="home-kicker">{homeCopy.market.kicker}</span>
            <h2>{homeCopy.market.title}</h2>
            <p>{homeCopy.market.description}</p>
            <div className="home-cta-pair">
              <a className="home-inline-link" href="/shop" onClick={(event) => navigate(event, '/shop')}>
                {homeCopy.market.shopCta}
                <ArrowRight size={16} />
              </a>
              <a className="home-inline-link" href="/p2p" onClick={(event) => navigate(event, '/p2p')}>
                {homeCopy.market.p2pCta}
                <Store size={16} />
              </a>
            </div>
          </div>

          <div className="home-commerce-list">
            {featuredProducts.map((product) => {
              const href = `/shop/${product.slug}`

              return (
                <a key={product.id} href={href} onClick={(event) => navigate(event, href)}>
                  <img src={product.image} alt={homeCopy.productPreviewAlt(product.title)} loading="lazy" decoding="async" />
                  <span>{product.categoryLabel}</span>
                  <strong>{product.title}</strong>
                  <em>${formatShopPrice(product.price)}</em>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container home-bottom-grid">
          <article>
            <span>{homeCopy.bottom.community.kicker}</span>
            <h2>{homeCopy.bottom.community.title}</h2>
            <p>{homeCopy.bottom.community.description}</p>
            <a href="/community" onClick={(event) => navigate(event, '/community')}>
              {homeCopy.bottom.community.cta}
              <ArrowRight size={16} />
            </a>
          </article>
          <article>
            <span>{homeCopy.bottom.about.kicker}</span>
            <h2>{homeCopy.bottom.about.title}</h2>
            <p>{homeCopy.bottom.about.description}</p>
            <a href="/about" onClick={(event) => navigate(event, '/about')}>
              {homeCopy.bottom.about.cta}
              <ArrowRight size={16} />
            </a>
          </article>
        </div>
      </section>
    </div>
  )
}

export default HomePage
