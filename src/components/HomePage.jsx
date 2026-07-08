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
import { newsArticles } from '../content/news'
import { SEO_GUIDES } from '../data/guideContent'
import { LEONIDA_SECTIONS } from '../data/leonidaSections'
import { STREAM_OVERLAY_PRODUCTS, formatShopPrice, shopProductSlug } from '../shop/shopData'
import './HomePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function HomePage({ onNavigate }) {
  const navigate = (event, href) => {
    if (!href.startsWith('/') || !onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  const hubLinks = [
    {
      href: '/news',
      icon: Newspaper,
      title: 'Latest GTA VI Updates',
      description: 'Follow official updates, trailer context, source-linked coverage, and release status.',
    },
    {
      href: '/leonida',
      icon: BookOpenText,
      title: 'Leonida Field Guide',
      description: 'Read the broad Leonida hub for map, cast, vehicles, weapons, and social-media worldbuilding.',
    },
    {
      href: '/leonida/characters',
      icon: UsersRound,
      title: 'Characters',
      description: 'Meet Lucia, Jason, and the supporting cast visible in public GTA VI material.',
    },
    {
      href: '/leonida/locations',
      icon: MapPinned,
      title: 'Locations',
      description: 'Explore Vice City, Port Gellhorn, Grassrivers, the Keys, Ambrosia, and other known regions.',
    },
    {
      href: '/leonida/vehicles',
      icon: Car,
      title: 'Vehicles',
      description: 'Browse cars, bikes, boats, aircraft, and public trailer vehicle references.',
    },
    {
      href: '/leonida/weapons',
      icon: Crosshair,
      title: 'Weapons',
      description: 'Review known weapon categories and clearly separated speculation notes.',
    },
    {
      href: '/shop',
      icon: ShoppingBag,
      title: 'Creator Shop',
      description: 'Buy unofficial GTA VI-inspired overlays, emotes, and profile banners with digital delivery.',
    },
    {
      href: '/p2p',
      icon: Store,
      title: 'P2P Marketplace',
      description: 'Trade fan-made creator goods, guides, and services with P2P listing tools.',
    },
    {
      href: '/community',
      icon: MessageCircle,
      title: 'Community',
      description: 'Post theories, vote in polls, track sources, and follow fan conversation around Leonida.',
    },
    {
      href: '/about',
      icon: BookOpenText,
      title: 'About GTA VI',
      description: 'Check release facts, countdown details, platform notes, and estimate boundaries.',
    },
  ]
  const featuredProducts = STREAM_OVERLAY_PRODUCTS.slice(0, 3)
  const featuredNews = newsArticles.slice(0, 3)

  return (
    <div className="home-page">
      <section className="home-hero">
        <img
          src="/images/leonida/locations-day.webp"
          alt=""
          className="home-hero-image"
          aria-hidden="true"
          loading="eager"
          decoding="async"
        />
        <div className="home-hero-scrim" aria-hidden="true" />
        <div className="container home-hero-inner">
          <h1>GTA VI Fan Hub & Creator Marketplace</h1>
          <p>
            Track GTA VI news, release updates, Leonida map details, characters, vehicles,
            weapons, and fan-made creator assets in one unofficial hub.
          </p>
          <div className="home-hero-actions">
            <a href="/news" onClick={(event) => navigate(event, '/news')}>
              Latest GTA VI news
              <ArrowRight size={17} />
            </a>
            <a href="/leonida" onClick={(event) => navigate(event, '/leonida')}>
              Explore Leonida
              <MapPinned size={17} />
            </a>
            <a href="/shop" onClick={(event) => navigate(event, '/shop')}>
              Creator Shop
              <ShoppingBag size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>News hub</span>
              <h2>Latest GTA VI Updates</h2>
            </div>
            <p>
              Static, source-aware coverage for release status, Leonida map details, characters,
              vehicles, weapons, platforms, and official announcements.
            </p>
          </header>

          <div className="home-news-grid">
            {featuredNews.map((article) => (
              <a key={article.slug} href={`/news/${article.slug}`} onClick={(event) => navigate(event, `/news/${article.slug}`)}>
                <span>{article.category}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <small>Updated {article.updatedAt}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>Start here</span>
              <h2>GTA VI hubs and creator paths</h2>
            </div>
            <p>
              Leonida Loot connects informational GTA VI research with clearly unofficial creator
              assets, community discussion, and marketplace listings.
            </p>
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
                    Explore
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
            <span className="home-kicker">Evergreen guides</span>
            <h2>Confirmed details separated from rumor</h2>
            <p>
              Guide pages keep official information, source context, and fan analysis in separate
              sections so GTA VI readers can scan quickly without mistaking speculation for fact.
            </p>
            <a className="home-inline-link" href="/guides" onClick={(event) => navigate(event, '/guides')}>
              View all guides
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="home-guide-list">
            {SEO_GUIDES.slice(0, 4).map((guide) => (
              <a key={guide.slug} href={`/guides/${guide.slug}`} onClick={(event) => navigate(event, `/guides/${guide.slug}`)}>
                <strong>{guide.title}</strong>
                <span>{guide.summary}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <span>Leonida field guide</span>
              <h2>Characters, locations, vehicles, weapons and social media</h2>
            </div>
            <p>
              The field guide keeps the major Leonida search paths separated into crawlable
              pages with clear confirmed-versus-reported context.
            </p>
          </header>

          <div className="home-leonida-grid">
            {LEONIDA_SECTIONS.map((section) => (
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
            <span className="home-kicker">Creator assets</span>
            <h2>Creator Shop and P2P Marketplace</h2>
            <p>
              Browse first-party creator packs in the shop or open the P2P marketplace for
              seller-to-buyer listings, messaging, file delivery, and trust policies.
            </p>
            <div className="home-cta-pair">
              <a className="home-inline-link" href="/shop" onClick={(event) => navigate(event, '/shop')}>
                Browse Creator Shop
                <ArrowRight size={16} />
              </a>
              <a className="home-inline-link" href="/p2p" onClick={(event) => navigate(event, '/p2p')}>
                Open P2P Marketplace
                <Store size={16} />
              </a>
            </div>
          </div>

          <div className="home-commerce-list">
            {featuredProducts.map((product) => (
              <a key={product.id} href={`/shop/${shopProductSlug(product)}`} onClick={(event) => navigate(event, `/shop/${shopProductSlug(product)}`)}>
                <img src={product.image} alt={`Preview of ${product.title}`} loading="lazy" decoding="async" />
                <span>{product.categoryLabel}</span>
                <strong>{product.title}</strong>
                <em>${formatShopPrice(product.price)}</em>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding home-section">
        <div className="container home-bottom-grid">
          <article>
            <span>Community</span>
            <h2>Community</h2>
            <p>
              Read and share GTA VI posts, theories, polls, source notes, and Leonida fan
              discussion from the community hub.
            </p>
            <a href="/community" onClick={(event) => navigate(event, '/community')}>
              Read community updates
              <ArrowRight size={16} />
            </a>
          </article>
          <article>
            <span>Release facts</span>
            <h2>About GTA VI</h2>
            <p>
              Review the GTA VI release countdown, platform notes, pricing context, and clearly
              labeled estimates in the About GTA VI page.
            </p>
            <a href="/about" onClick={(event) => navigate(event, '/about')}>
              Open About GTA VI
              <ArrowRight size={16} />
            </a>
          </article>
        </div>
      </section>
    </div>
  )
}

export default HomePage
