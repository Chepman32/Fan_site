import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Expand,
  Images,
  X,
} from 'lucide-react'
import { rockstarPromoMedia } from '../data/rockstarPromoMedia'
import './PromoGallery.css'

const INITIAL_VISIBLE_ITEMS = 12
const LOAD_MORE_ITEMS = 12
const COLLECTION_ORDER = ['artwork', 'screenshots', 'ultimate']

function imageUrl(src, width) {
  return `${src}?akim=1&imdensity=1&imwidth=${width}`
}

function PromoGallery({ copy }) {
  const [activeCollection, setActiveCollection] = useState('artwork')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS)
  const [activeImageIndex, setActiveImageIndex] = useState(null)
  const items = rockstarPromoMedia.collections[activeCollection]
  const visibleItems = items.slice(0, visibleCount)
  const activeImage = activeImageIndex === null ? null : items[activeImageIndex]
  const remainingCount = Math.max(items.length - visibleItems.length, 0)

  useEffect(() => {
    if (activeImageIndex === null) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') setActiveImageIndex(null)
      if (event.key === 'ArrowLeft') {
        setActiveImageIndex((current) => (current - 1 + items.length) % items.length)
      }
      if (event.key === 'ArrowRight') {
        setActiveImageIndex((current) => (current + 1) % items.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, items.length])

  function selectCollection(collection) {
    setActiveCollection(collection)
    setVisibleCount(INITIAL_VISIBLE_ITEMS)
    setActiveImageIndex(null)
  }

  function showPreviousImage() {
    setActiveImageIndex((current) => (current - 1 + items.length) % items.length)
  }

  function showNextImage() {
    setActiveImageIndex((current) => (current + 1) % items.length)
  }

  return (
    <section className="about-promo-section section-padding" aria-labelledby="promo-gallery-title">
      <div className="container">
        <header className="about-section-heading about-promo-heading">
          <div>
            <span><Images size={14} /> {copy.eyebrow}</span>
            <h2 id="promo-gallery-title">{copy.title}</h2>
          </div>
          <div className="about-promo-intro">
            <p>{copy.description}</p>
            <a
              href={rockstarPromoMedia.sources[activeCollection]}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.viewSource} <ExternalLink size={14} />
            </a>
          </div>
        </header>

        <div className="promo-gallery-tabs" role="tablist" aria-label={copy.tabsLabel}>
          {COLLECTION_ORDER.map((collection) => (
            <button
              key={collection}
              id={`promo-tab-${collection}`}
              type="button"
              role="tab"
              aria-controls={`promo-panel-${collection}`}
              aria-selected={activeCollection === collection}
              className={activeCollection === collection ? 'is-active' : ''}
              onClick={() => selectCollection(collection)}
            >
              <span>{copy.tabs[collection]}</span>
              <strong>{rockstarPromoMedia.collections[collection].length}</strong>
            </button>
          ))}
        </div>

        <div
          id={`promo-panel-${activeCollection}`}
          className="promo-gallery-grid"
          role="tabpanel"
          aria-labelledby={`promo-tab-${activeCollection}`}
        >
          {visibleItems.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="promo-gallery-card"
              onClick={() => setActiveImageIndex(index)}
              aria-label={`${copy.openImage}: ${image.title}`}
            >
              <img
                src={imageUrl(image.src, 1280)}
                srcSet={`${imageUrl(image.src, 640)} 640w, ${imageUrl(image.src, 1280)} 1280w`}
                sizes={index === 0 ? '(max-width: 700px) 100vw, 66vw' : '(max-width: 700px) 100vw, 33vw'}
                alt={image.title}
                width={image.width}
                height={image.height}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="promo-gallery-card-shade" aria-hidden="true" />
              <span className="promo-gallery-card-copy">
                <small>{copy.official}</small>
                <strong>{image.title}</strong>
              </span>
              <span className="promo-gallery-expand" aria-hidden="true"><Expand size={16} /></span>
            </button>
          ))}
        </div>

        <div className="promo-gallery-footer">
          <p>{copy.showing} {visibleItems.length} {copy.of} {items.length}</p>
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + LOAD_MORE_ITEMS)}
            >
              {copy.showMore} <span>+{Math.min(LOAD_MORE_ITEMS, remainingCount)}</span>
            </button>
          )}
          <span className="promo-gallery-attribution">{copy.sourceNote}</span>
        </div>
      </div>

      {activeImage && (
        <div
          className="promo-lightbox"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveImageIndex(null)
          }}
        >
          <div
            className="promo-lightbox-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={activeImage.title}
          >
            <div className="promo-lightbox-toolbar">
              <span>{activeImageIndex + 1} / {items.length}</span>
              <div>
                <a
                  href={imageUrl(activeImage.src, 3840)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.fullSize} <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(null)}
                  aria-label={copy.close}
                  autoFocus
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="promo-lightbox-stage">
              <button type="button" onClick={showPreviousImage} aria-label={copy.previous}>
                <ChevronLeft size={24} />
              </button>
              <figure>
                <img
                  src={imageUrl(activeImage.src, 1920)}
                  alt={activeImage.title}
                  width={activeImage.width}
                  height={activeImage.height}
                />
                <figcaption>
                  <small>{copy.tabs[activeCollection]}</small>
                  <strong>{activeImage.title}</strong>
                </figcaption>
              </figure>
              <button type="button" onClick={showNextImage} aria-label={copy.next}>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PromoGallery
