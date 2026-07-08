import { ArrowLeft, ArrowRight, CheckCircle2, FileArchive, Handshake, ShieldCheck, Store } from 'lucide-react'
import {
  P2P_SEED_LISTING_BY_SLUG,
  formatFileSize,
  formatP2PPrice,
  p2pCategoryLabel,
} from '../p2p/p2pData'
import { getMarketplaceListingContent } from '../content/marketplaceListings'
import './CommerceDetailPage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function MarketplaceListingPage({ slug, onNavigate }) {
  const listing = P2P_SEED_LISTING_BY_SLUG[slug]

  if (!listing) {
    return (
      <section className="commerce-page section-padding">
        <div className="container commerce-shell">
          <nav className="commerce-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
            <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>Marketplace</a>
          </nav>
          <div className="commerce-empty">
            <h1>Marketplace listing not found</h1>
            <p>This listing may be sold, unpublished, or unavailable. Browse active creator listings in the P2P marketplace.</p>
            <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
              Back to marketplace
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  const fileCount = listing.files?.length || 0
  const totalSize = (listing.files || []).reduce((sum, file) => sum + Number(file.size || 0), 0)
  const listingContent = getMarketplaceListingContent(listing)

  return (
    <article className="commerce-page section-padding">
      <div className="container commerce-shell">
        <nav className="commerce-breadcrumbs" aria-label="Breadcrumb">
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
          <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>Marketplace</a>
          <span>{listing.title}</span>
        </nav>

        <a className="commerce-back" href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
          <ArrowLeft size={16} />
          Back to marketplace
        </a>

        <header className="commerce-hero">
          <div className="commerce-hero-media">
            <img src={listing.previewDataUrl} alt={`Preview of ${listing.title}`} loading="eager" decoding="async" />
          </div>
          <div className="commerce-hero-copy">
            <span><Handshake size={16} /> {p2pCategoryLabel(listing.category)}</span>
            <h1>{listing.title}</h1>
            <p>{listingContent.longDescription}</p>
            <div className="commerce-price-row">
              <strong>{formatP2PPrice(listing)}</strong>
              <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
                Open checkout
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </header>

        <div className="commerce-detail-grid">
          <section className="commerce-wide">
            <h2>Preview images</h2>
            <p>Seller-provided preview assets for this fan-made marketplace listing.</p>
            <div className="commerce-gallery">
              {listingContent.previewImages.map((image, index) => (
                <img key={image} src={image} alt={`${listing.title} preview ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              ))}
            </div>
          </section>

          <section>
            <h2>What is included</h2>
            <p>
              {listingContent.shortDescription} The seller describes delivery as
              {' '}{listingContent.deliveryMethod.toLowerCase()}.
            </p>
            <ul>
              {listing.properties.map((property) => (
                <li key={property.key}><CheckCircle2 size={16} /> {property.key}: {property.value}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>File details</h2>
            <p>
              The listing references {fileCount} stored file{fileCount === 1 ? '' : 's'} totaling
              {' '}{formatFileSize(totalSize)}. Reported file formats:
              {' '}{listingContent.fileFormats.join(', ')}.
            </p>
            <ul>
              {(listing.files || []).map((file) => (
                <li key={file.name}><FileArchive size={16} /> {file.name} - {formatFileSize(file.size)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>License</h2>
            <p>{listingContent.license}</p>
          </section>

          <section>
            <h2>Seller information</h2>
            <p>
              Seller id: {listing.sellerId}. Use marketplace messaging for delivery questions,
              compatibility details, and any clarifications before sending USDT.
            </p>
            <p className="commerce-note"><Store size={16} /> Public seed listing shown for marketplace discovery.</p>
          </section>

          <section>
            <h2>Delivery and refund policy</h2>
            <p>
              P2P purchases rely on seller delivery and transaction records. Review buyer protection,
              seller policy, and refund guidance before using crypto checkout.
            </p>
            <a href="/buyer-protection" onClick={(event) => navigateInternally(event, '/buyer-protection', onNavigate)}>
              Buyer protection
              <ArrowRight size={15} />
            </a>
          </section>

          <section>
            <h2>Unofficial fan listing</h2>
            <p>
              Leonida Loot does not sell official GTA VI game files, leaks, or Rockstar assets through
              marketplace listings. Sellers are responsible for uploading only files they own or can distribute.
            </p>
            <p className="commerce-note"><ShieldCheck size={16} /> Report suspicious or rights-infringing listings for review.</p>
          </section>

          <section className="commerce-wide">
            <h2>FAQ</h2>
            <div className="commerce-faq-list">
              {listingContent.faq.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="commerce-wide">
            <h2>Related listings</h2>
            <div className="commerce-related-list">
              {listingContent.relatedListings.map((related) => (
                <a key={related.href} href={related.href} onClick={(event) => navigateInternally(event, related.href, onNavigate)}>
                  <img src={related.image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                  <span>{related.title}</span>
                  <ArrowRight size={15} />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

export default MarketplaceListingPage
