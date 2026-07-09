import { useEffect, useMemo, useState } from 'react'
import { Building2, Image as ImageIcon, Loader, MapPin } from 'lucide-react'
import {
  FALLBACK_LEONIDA_DATA,
  LEONIDA_URL,
  fetchTextWithTimeout,
  formatUpdatedAt,
  locationPathFromIgnUrl,
  parseLeonidaPage,
} from '../data/ignWiki'
import {
  leonidaTranslationSource,
  plainContentTranslationSource,
  translateLeonidaData,
  translatePlainContent,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { locationGuideItems, locationGuideSections } from '../content/leonidaLocations'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './LeonidaLocations.css'

const STATIC_GUIDE_TRANSLATION_OPTIONS = {
  keys: ['ariaLabel', 'body', 'description', 'status', 'subtitle', 'title'],
  arrayKeys: ['facts'],
}
const LOCATION_STATIC_GUIDE = {
  ariaLabel: 'GTA VI Leonida locations guide',
  title: 'GTA VI Leonida locations guide',
  description: 'This static location guide keeps the major Leonida regions visible in the first HTML response, including Vice City, the Leonida Keys, wetlands, coastal towns, industrial areas, wilderness, roads, beaches, hotels, and highways.',
}

function translateLocationStaticGuide(data, lang) {
  return translatePlainContent(data, lang, STATIC_GUIDE_TRANSLATION_OPTIONS)
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaLocations({ onNavigate }) {
  const { t, lang } = useTranslation()
  const [data, setData] = useState(FALLBACK_LEONIDA_DATA)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let canceled = false

    const fetchLeonidaLocations = async () => {
      try {
        const html = await fetchTextWithTimeout(LEONIDA_URL)
        const parsedData = parseLeonidaPage(html)
        if (!canceled) {
          setData(parsedData)
        }
      } catch (error) {
        console.log('IGN Leonida fetch failed, using fallback:', error)
        if (!canceled) {
          setData(FALLBACK_LEONIDA_DATA)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchLeonidaLocations()

    return () => {
      canceled = true
    }
  }, [])

  const translationSource = useMemo(() => leonidaTranslationSource(data), [data])
  const { data: displayData } = useTranslatedIgnContent(data, {
    enabled: !loading,
    lang,
    scope: 'leonida',
    source: translationSource,
    translate: translateLeonidaData,
  })
  const staticGuideData = useMemo(() => ({
    chrome: LOCATION_STATIC_GUIDE,
    items: locationGuideItems,
    sections: locationGuideSections,
  }), [])
  const staticGuideSource = useMemo(
    () => plainContentTranslationSource(staticGuideData, STATIC_GUIDE_TRANSLATION_OPTIONS),
    [staticGuideData],
  )
  const { data: displayStaticGuide } = useTranslatedIgnContent(staticGuideData, {
    enabled: !loading,
    lang,
    scope: 'leonida-locations-static-guide',
    source: staticGuideSource,
    translate: translateLocationStaticGuide,
  })

  const locationStats = useMemo(
    () => [
      { label: t.leonida.stats.majorRegions, value: displayData.majorLocations.length },
      { label: t.leonida.stats.spottedPlaces, value: displayData.otherLocations.length },
      { label: t.leonida.stats.businesses, value: displayData.businesses.length },
    ],
    [displayData, t],
  )

  const navigateToLocation = (event, href) => {
    if (href.startsWith('http')) return
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <section id="leonida" className="section-padding leonida-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {t.leonida.title} <span className="gradient-text">{t.leonida.titleHighlight}</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{t.leonida.loading}</p>
          </div>
        )}

        {!loading && (
          <div className="leonida-content">
            <div className="leonida-overview">
              <div>
                <span className="leonida-kicker">{t.leonida.updatedOn} {formatUpdatedAt(data.updatedAt)}</span>
                <div className="leonida-copy">
                  {displayData.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="leonida-stats">
                {locationStats.map((stat) => (
                  <div key={stat.label} className="leonida-stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="leonida-images" aria-label={t.leonida.locationDetail.imagesLabel(t.leonida.title)}>
              {displayData.images.map((image) => (
                <figure key={image.id} className="leonida-image-card">
                  <img src={image.url} alt={image.title} loading="lazy" decoding="async" />
                  <figcaption>
                    <ImageIcon size={14} />
                    {image.title}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="major-locations-grid">
              {displayData.majorLocations.map((location) => {
                const href = location.path || locationPathFromIgnUrl(location.url) || (location.id ? `/leonida/locations/${location.id}` : LEONIDA_URL)

                return (
                  <a
                    key={location.id}
                    className="major-location-card"
                    href={href}
                    onClick={(event) => navigateToLocation(event, href)}
                  >
                    <span className="location-marker">
                      <MapPin size={18} />
                    </span>
                    <strong>{location.name}</strong>
                  </a>
                )
              })}
            </div>

            <div className="leonida-lists">
              <article className="leonida-list-panel">
                <h3>
                  <MapPin size={18} />
                  {t.leonida.otherLocations}
                </h3>
                <div className="tag-list">
                  {displayData.otherLocations.map((location) => (
                    <span key={location}>{location}</span>
                  ))}
                </div>
              </article>

              <article className="leonida-list-panel">
                <h3>
                  <Building2 size={18} />
                  {t.leonida.shopsAndBusinesses}
                </h3>
                <div className="tag-list">
                  {displayData.businesses.map((business) => (
                    <span key={business}>{business}</span>
                  ))}
                </div>
              </article>
            </div>

            <div className="leonida-static-guide" aria-label={displayStaticGuide.chrome.ariaLabel}>
              <div className="leonida-guide-intro">
                <h3>{displayStaticGuide.chrome.title}</h3>
                <p>{displayStaticGuide.chrome.description}</p>
              </div>
              <div className="leonida-guide-grid">
                {displayStaticGuide.items.map((location) => (
                  <article key={location.title}>
                    <span>{location.status}</span>
                    <h3>{location.title}</h3>
                    <strong>{location.subtitle}</strong>
                    <p>{location.description}</p>
                    <ul>
                      {location.facts.map((fact) => <li key={fact}>{fact}</li>)}
                    </ul>
                    {location.relatedLinks?.map((link) => (
                      <a key={link.href} href={link.href} onClick={(event) => navigateToLocation(event, link.href)}>
                        {link.label}
                      </a>
                    ))}
                  </article>
                ))}
              </div>
              <div className="leonida-guide-notes">
                {displayStaticGuide.sections.map((section) => (
                  <article key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default LeonidaLocations
