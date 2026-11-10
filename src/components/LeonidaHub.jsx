import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { localizeLeonidaSections } from '../data/leonidaSections'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './LeonidaHub.css'

const LEONIDA_EXPLAINER_CHROME = {
  title: 'About these guides',
}
const LEONIDA_EXPLAINER_SECTIONS = [
  {
    title: 'Where to start',
    body: 'Start with locations to get your bearings, then meet Lucia, Jason, and the people they encounter across Leonida.',
  },
  {
    title: 'What Rockstar has shown',
    body: 'The guides cite trailers, screenshots, and other public sources. Look for labels that distinguish official details from fan observations and estimates.',
  },
  {
    title: 'Fan-made assets',
    body: 'The shop and marketplace feature unofficial creations such as stream overlays, emotes, and banners.',
  },
]
const EXPLAINER_TRANSLATION_OPTIONS = {
  keys: ['body', 'title'],
}

function translateExplainer(data, lang) {
  return translatePlainContent(data, lang, EXPLAINER_TRANSLATION_OPTIONS)
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaHub({ onNavigate }) {
  const { t, lang } = useTranslation()
  const copy = t.leonidaHub
  const sections = localizeLeonidaSections(copy)
  const explainerData = useMemo(() => ({
    chrome: LEONIDA_EXPLAINER_CHROME,
    sections: LEONIDA_EXPLAINER_SECTIONS,
  }), [])
  const explainerSource = useMemo(
    () => plainContentTranslationSource(explainerData, EXPLAINER_TRANSLATION_OPTIONS),
    [explainerData],
  )
  const { data: displayExplainer } = useTranslatedIgnContent(explainerData, {
    lang,
    scope: 'leonida-hub-explainer',
    source: explainerSource,
    translate: translateExplainer,
  })

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

      <section className="section-padding leonida-explainer" aria-labelledby="leonida-explainer-title">
        <div className="container">
          <header className="leonida-explainer-heading">
            <h2 id="leonida-explainer-title">{displayExplainer.chrome.title}</h2>
          </header>

          <div className="leonida-explainer-grid">
            {displayExplainer.sections.map((section) => (
              <article key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LeonidaHub
