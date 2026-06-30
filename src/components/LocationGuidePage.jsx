import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ExternalLink, Image as ImageIcon, Loader, MapPin } from 'lucide-react'
import {
  createFallbackLocationPage,
  fetchTextWithTimeout,
  formatUpdatedAt,
  getLocationGuideBySlug,
  parseLocationGuidePage,
} from '../data/ignWiki'
import {
  locationPageTranslationSource,
  translateLocationPageData,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './LocationGuidePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LocationGuidePage({ locationSlug, onNavigate }) {
  const { t, lang } = useTranslation()
  const guide = useMemo(() => getLocationGuideBySlug(locationSlug), [locationSlug])
  const fallbackPage = useMemo(() => (guide ? createFallbackLocationPage(guide) : null), [guide])
  const [remoteState, setRemoteState] = useState({ guideId: '', page: null, failed: false })
  const hasRemotePage = Boolean(guide && remoteState.guideId === guide.id)
  const page = hasRemotePage ? remoteState.page : fallbackPage
  const loading = Boolean(guide && !page)
  const failed = Boolean(hasRemotePage && remoteState.failed)

  useEffect(() => {
    if (!guide) return undefined

    let canceled = false

    const fetchLocationGuide = async () => {
      try {
        const html = await fetchTextWithTimeout(guide.url)
        const parsedPage = parseLocationGuidePage(html, guide)

        if (!canceled) {
          setRemoteState({ guideId: guide.id, page: parsedPage, failed: false })
        }
      } catch (error) {
        console.log('IGN location fetch failed, using fallback:', error)
        if (!canceled) {
          setRemoteState({ guideId: guide.id, page: createFallbackLocationPage(guide), failed: true })
        }
      }
    }

    fetchLocationGuide()

    return () => {
      canceled = true
    }
  }, [guide])

  const translationSource = useMemo(() => (page ? locationPageTranslationSource(page) : null), [page])
  const { data: displayPage } = useTranslatedIgnContent(page, {
    enabled: !loading && Boolean(page),
    lang,
    scope: `location-${guide?.id || locationSlug}`,
    source: translationSource,
    translate: translateLocationPageData,
  })

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  if (!guide) {
    return (
      <section className="section-padding location-detail-section">
        <div className="container location-detail-container">
          <a className="location-back-link" href="/leonida/locations" onClick={(event) => navigate(event, '/leonida/locations')}>
            <ArrowLeft size={16} />
            Leonida locations
          </a>
          <div className="location-empty-state">
            <MapPin size={28} />
            <h1>Location not found</h1>
            <p>Choose one of the six major Leonida locations from the guide list.</p>
          </div>
        </div>
      </section>
    )
  }

  const heroImage = displayPage?.images[0]
  const galleryImages = displayPage?.images.slice(1) || []

  return (
    <section className="section-padding location-detail-section">
      <div className="container location-detail-container">
        <a className="location-back-link" href="/leonida/locations" onClick={(event) => navigate(event, '/leonida/locations')}>
          <ArrowLeft size={16} />
          Leonida locations
        </a>

        {loading && (
          <div className="loading-state location-detail-loader">
            <Loader size={32} className="animate-spin" />
            <p>Loading {guide.name} guide...</p>
          </div>
        )}

        {!loading && displayPage && (
          <>
            <header className={`location-detail-hero ${heroImage ? '' : 'no-image'}`}>
              <div className="location-detail-copy">
                <span className="location-detail-kicker">
                  <MapPin size={15} />
                  IGN wiki location guide
                </span>
                <h1>{displayPage.title}</h1>
                {displayPage.description && <p>{displayPage.description}</p>}
                <div className="location-detail-meta">
                  <span>
                    <CalendarDays size={15} />
                    {t.leonida.updatedOn} {formatUpdatedAt(displayPage.updatedAt)}
                  </span>
                  <a href={displayPage.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={15} />
                    IGN source
                  </a>
                </div>
              </div>

              {heroImage && (
                <figure className="location-hero-image">
                  <img src={heroImage.url} alt={heroImage.title} decoding="async" />
                  <figcaption>
                    <ImageIcon size={14} />
                    {heroImage.title}
                  </figcaption>
                </figure>
              )}
            </header>

            {failed && (
              <div className="location-source-note">
                Live IGN parsing failed, so this page is showing the saved fallback summary.
              </div>
            )}

            <div className="location-detail-intro">
              {displayPage.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {galleryImages.length > 0 && (
              <div className="location-detail-gallery" aria-label={`${displayPage.title} images`}>
                {galleryImages.map((image) => (
                  <figure key={image.id}>
                    <img src={image.url} alt={image.title} loading="lazy" decoding="async" />
                    <figcaption>
                      <ImageIcon size={14} />
                      {image.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {displayPage.sections.length > 0 ? (
              <div className="location-detail-article">
                {displayPage.sections.map((section) => (
                  <article key={section.id} className="location-article-section">
                    <h2>{section.title}</h2>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.links.length > 0 && (
                      <div className="location-inline-links">
                        {section.links.map((link) => (
                          <a
                            key={link.path || link.url || link.name}
                            href={link.path || link.url}
                            target={link.path ? undefined : '_blank'}
                            rel={link.path ? undefined : 'noopener noreferrer'}
                            onClick={link.path ? (event) => navigate(event, link.path) : undefined}
                          >
                            {link.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="location-empty-copy">
                <p>Detailed section content will appear here when the IGN wiki article can be parsed.</p>
              </div>
            )}

            {displayPage.relatedLinks.length > 0 && (
              <aside className="location-related-panel">
                <h2>Other Leonida locations</h2>
                <div>
                  {displayPage.relatedLinks.map((link) => (
                    <a
                      key={link.id || link.path || link.name}
                      href={link.path || link.url}
                      onClick={link.path ? (event) => navigate(event, link.path) : undefined}
                    >
                      <MapPin size={14} />
                      {link.name}
                    </a>
                  ))}
                </div>
              </aside>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default LocationGuidePage
