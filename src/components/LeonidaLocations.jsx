import { useEffect, useMemo, useState } from 'react'
import { Building2, Image as ImageIcon, Loader, Map, MapPin } from 'lucide-react'
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
  translateLeonidaData,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './LeonidaLocations.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaLocations({ onNavigate }) {
  const { t, lang } = useTranslation()
  const [data, setData] = useState(FALLBACK_LEONIDA_DATA)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let canceled = false

    const fetchLeonidaLocations = async () => {
      try {
        setLoading(true)
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

            <div className="leonida-images" aria-label="IGN Leonida location images">
              {displayData.images.map((image) => (
                <figure key={image.id} className="leonida-image-card">
                  <img src={image.url} alt={image.title} loading="lazy" />
                  <figcaption>
                    <ImageIcon size={14} />
                    {image.title}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="major-locations-grid">
              {displayData.majorLocations.map((location) => {
                const href = location.path || locationPathFromIgnUrl(location.url) || (location.id ? `/locations/${location.id}` : LEONIDA_URL)

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
                    <span>
                      {t.leonida.ignGuide}
                      <Map size={13} />
                    </span>
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
          </div>
        )}
      </div>
    </section>
  )
}

export default LeonidaLocations
