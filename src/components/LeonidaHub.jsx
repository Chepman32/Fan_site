import { ArrowRight, Map, Sparkles } from 'lucide-react'
import { localizeLeonidaSections } from '../data/leonidaSections'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './LeonidaHub.css'

const LEONIDA_EXPLAINER_SECTIONS = [
  {
    title: 'What This Leonida Hub Covers',
    body: 'Leonida Loot treats the state as a connected field guide: Vice City and coastal nightlife, the Leonida Keys, wetlands, inland roads, vehicles, weapons, characters, and fictional social media moments are grouped so readers can move from broad context to focused guides.',
  },
  {
    title: 'Confirmed vs Reported Details',
    body: 'Official Rockstar material, trailers, screenshots, and reputable guide references are separated from community interpretation. When something is estimated, rumored, or reconstructed from public footage, the guide language should make that confidence level clear.',
  },
  {
    title: 'How To Use The Guide',
    body: 'Start with locations to understand the state, move into characters for story context, then use vehicles, weapons, and social media to connect trailer moments. Each section links deeper so search visitors can land on the exact topic they need.',
  },
  {
    title: 'Fan-Made Creator Context',
    body: 'Leonida Loot also connects guide readers to unofficial creator assets in the shop and P2P marketplace. These items must stay clearly fan-made and must never imply official Rockstar affiliation, leaked files, or ripped game assets.',
  },
]

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaHub({ onNavigate }) {
  const { t } = useTranslation()
  const copy = t.leonidaHub
  const sections = localizeLeonidaSections(copy)

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <div className="leonida-hub">
      <section id="leonida-overview" className="leonida-hub-hero">
        <div className="leonida-hub-hero-glow" aria-hidden="true" />
        <div className="container leonida-hub-hero-inner">
          <div className="leonida-hub-hero-copy">
            <span className="leonida-hub-kicker"><Sparkles size={14} /> {copy.hero.kicker}</span>
            <h1>{copy.hero.title} <span>{copy.hero.titleHighlight}</span></h1>
            <p>{copy.hero.description}</p>
            <a href="#field-guide" onClick={(event) => navigate(event, '/leonida#field-guide')}>
              {copy.hero.openGuide}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="leonida-hub-hero-art">
            <img src="/images/leonida/locations-day.webp" alt={copy.hero.imageAlt} />
            <div className="leonida-hub-map-stamp">
              <Map size={20} />
              <span>{copy.hero.stamp}</span>
              <strong>05 {copy.hero.collections}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding leonida-explainer" aria-labelledby="leonida-explainer-title">
        <div className="container">
          <header className="leonida-explainer-heading">
            <span>Reader context</span>
            <h2 id="leonida-explainer-title">How Leonida Loot Organizes GTA VI Coverage</h2>
            <p>
              Use this hub as the stable doorway into GTA VI map, character, vehicle, weapon,
              social-media, shop, and marketplace coverage.
            </p>
          </header>

          <div className="leonida-explainer-grid">
            {LEONIDA_EXPLAINER_SECTIONS.map((section) => (
              <article key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="field-guide" className="section-padding leonida-directory">
        <div className="container">
          <header className="leonida-directory-heading">
            <div>
              <span>{copy.directory.eyebrow}</span>
              <h2>{copy.directory.title}</h2>
            </div>
            <p>{copy.directory.description}</p>
          </header>

          <div className="leonida-directory-grid">
            {sections.map((section, index) => {
              const Icon = section.icon

              return (
                <a
                  key={section.id}
                  className={`leonida-directory-card accent-${section.accent} tone-${section.tone || 'night'} ${index === 0 ? 'featured' : ''}`}
                  href={section.href}
                  onClick={(event) => navigate(event, section.href)}
                >
                  <img src={section.image} alt="" aria-hidden="true" loading={index > 1 ? 'lazy' : 'eager'} />
                  <span className="leonida-directory-scrim" aria-hidden="true" />
                  <div className="leonida-directory-card-copy">
                    <span className="leonida-directory-icon"><Icon size={18} /></span>
                    <span className="leonida-directory-count">{section.count}</span>
                    <div>
                      <p>{section.shortTitle}</p>
                      <h3>{section.title}</h3>
                    </div>
                    <span className="leonida-directory-open">{copy.directory.explore} <ArrowRight size={16} /></span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LeonidaHub
