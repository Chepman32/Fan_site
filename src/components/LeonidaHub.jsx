import { ArrowRight, Map, Sparkles } from 'lucide-react'
import { LEONIDA_SECTIONS } from '../data/leonidaSections'
import './LeonidaHub.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaHub({ onNavigate }) {
  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <div className="leonida-hub">
      <section id="about" className="leonida-hub-hero">
        <div className="leonida-hub-hero-glow" aria-hidden="true" />
        <div className="container leonida-hub-hero-inner">
          <div className="leonida-hub-hero-copy">
            <span className="leonida-hub-kicker"><Sparkles size={14} /> The GTA VI field guide</span>
            <h1>Welcome to <span>Leonida</span></h1>
            <p>
              One sunburnt state. Five ways in. Explore the people, places, rides,
              gear, and feeds defining Rockstar&apos;s newest open world.
            </p>
            <a href="#field-guide" onClick={(event) => navigate(event, '/leonida#field-guide')}>
              Open the field guide
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="leonida-hub-hero-art">
            <img src="/images/leonida/locations.webp" alt="A neon coastal panorama of Leonida" />
            <div className="leonida-hub-map-stamp">
              <Map size={20} />
              <span>State guide</span>
              <strong>05 collections</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="field-guide" className="section-padding leonida-directory">
        <div className="container">
          <header className="leonida-directory-heading">
            <div>
              <span>Choose your route</span>
              <h2>The Leonida field guide</h2>
            </div>
            <p>Every section is now a focused destination with its own research, imagery, and source-backed details.</p>
          </header>

          <div className="leonida-directory-grid">
            {LEONIDA_SECTIONS.map((section, index) => {
              const Icon = section.icon

              return (
                <a
                  key={section.id}
                  className={`leonida-directory-card accent-${section.accent} ${index === 0 ? 'featured' : ''}`}
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
                    <span className="leonida-directory-open">Explore <ArrowRight size={16} /></span>
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
