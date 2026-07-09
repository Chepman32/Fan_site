import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FileArchive, Handshake, ShieldCheck, Store } from 'lucide-react'
import {
  P2P_SEED_LISTING_BY_SLUG,
  formatFileSize,
  formatP2PPrice,
  p2pCategoryLabel,
} from '../p2p/p2pData'
import { getMarketplaceListingContent } from '../content/marketplaceListings'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './CommerceDetailPage.css'

const MARKETPLACE_DETAIL_CHROME = {
  breadcrumbLabel: 'Breadcrumb',
  home: 'Home',
  marketplace: 'Marketplace',
  listingNotFound: 'Marketplace listing not found',
  listingUnavailable: 'This listing may be sold, unpublished, or unavailable. Browse active creator listings in the P2P marketplace.',
  backToMarketplace: 'Back to marketplace',
  previewAlt: 'Preview of',
  previewImageAlt: 'preview',
  openCheckout: 'Open checkout',
  previewImages: 'Preview images',
  previewDescription: 'Seller-provided preview assets for this fan-made marketplace listing.',
  whatIncluded: 'What is included',
  fileDetails: 'File details',
  license: 'License',
  sellerInformation: 'Seller information',
  sellerId: 'Seller id',
  deliveryRefund: 'Delivery and refund policy',
  buyerProtection: 'Buyer protection',
  unofficialFanListing: 'Unofficial fan listing',
  faq: 'FAQ',
  relatedListings: 'Related listings',
  publicSeedListing: 'Public seed listing shown for marketplace discovery.',
  suspiciousNote: 'Report suspicious or rights-infringing listings for review.',
}
const MARKETPLACE_DETAIL_CHROME_TRANSLATION_OPTIONS = {
  keys: [
    'backToMarketplace',
    'breadcrumbLabel',
    'buyerProtection',
    'deliveryRefund',
    'faq',
    'fileDetails',
    'home',
    'license',
    'listingNotFound',
    'listingUnavailable',
    'marketplace',
    'openCheckout',
    'previewAlt',
    'previewDescription',
    'previewImageAlt',
    'previewImages',
    'publicSeedListing',
    'relatedListings',
    'sellerId',
    'sellerInformation',
    'suspiciousNote',
    'unofficialFanListing',
    'whatIncluded',
  ],
}
const MARKETPLACE_LISTING_TRANSLATION_OPTIONS = {
  onlyKeys: ['title', 'description', 'deliveryMethod', 'key', 'value'],
}
const MARKETPLACE_LISTING_CONTENT_TRANSLATION_OPTIONS = {
  keys: ['deliveryMethod', 'sellerName'],
}

function translateMarketplaceDetailChrome(data, lang) {
  return translatePlainContent(data, lang, MARKETPLACE_DETAIL_CHROME_TRANSLATION_OPTIONS)
}

function translateMarketplaceListing(data, lang) {
  return translatePlainContent(data, lang, MARKETPLACE_LISTING_TRANSLATION_OPTIONS)
}

function translateMarketplaceListingContent(data, lang) {
  return translatePlainContent(data, lang, MARKETPLACE_LISTING_CONTENT_TRANSLATION_OPTIONS)
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function MarketplaceListingPage({ slug, onNavigate }) {
  const { t, lang } = useTranslation()
  const listing = P2P_SEED_LISTING_BY_SLUG[slug]
  const listingContent = listing ? getMarketplaceListingContent(listing) : null
  const chromeSource = useMemo(() => plainContentTranslationSource(MARKETPLACE_DETAIL_CHROME, MARKETPLACE_DETAIL_CHROME_TRANSLATION_OPTIONS), [])
  const listingSource = useMemo(() => (listing ? plainContentTranslationSource(listing, MARKETPLACE_LISTING_TRANSLATION_OPTIONS) : null), [listing])
  const listingContentSource = useMemo(() => (
    listingContent ? plainContentTranslationSource(listingContent, MARKETPLACE_LISTING_CONTENT_TRANSLATION_OPTIONS) : null
  ), [listingContent])
  const generatedText = useMemo(() => {
    if (!listing || !listingContent) return null

    const nextFileCount = listing.files?.length || 0
    const nextTotalSize = (listing.files || []).reduce((sum, file) => sum + Number(file.size || 0), 0)

    return {
      includedDescription: `${listingContent.shortDescription} The seller describes delivery as ${listingContent.deliveryMethod.toLowerCase()}.`,
      fileDescription: `The listing references ${nextFileCount} stored file${nextFileCount === 1 ? '' : 's'} totaling ${formatFileSize(nextTotalSize)}. Reported file formats: ${listingContent.fileFormats.join(', ')}.`,
      sellerDescription: `Seller id: ${listing.sellerId}. Use marketplace messaging for delivery questions, compatibility details, and any clarifications before sending USDT.`,
      deliveryDescription: 'P2P purchases rely on seller delivery and transaction records. Review buyer protection, seller policy, and refund guidance before using crypto checkout.',
      unofficialDescription: 'Leonida Loot does not sell official GTA VI game files, leaks, or Rockstar assets through marketplace listings. Sellers are responsible for uploading only files they own or can distribute.',
    }
  }, [listing, listingContent])
  const generatedTextSource = useMemo(() => (generatedText ? plainContentTranslationSource(generatedText) : null), [generatedText])
  const { data: copy } = useTranslatedIgnContent(MARKETPLACE_DETAIL_CHROME, {
    lang,
    scope: 'marketplace-listing-detail-chrome',
    source: chromeSource,
    translate: translateMarketplaceDetailChrome,
  })
  const { data: displayListing } = useTranslatedIgnContent(listing, {
    enabled: Boolean(listing),
    lang,
    scope: `marketplace-listing-${slug}`,
    source: listingSource,
    translate: translateMarketplaceListing,
  })
  const { data: displayListingContent } = useTranslatedIgnContent(listingContent, {
    enabled: Boolean(listingContent),
    lang,
    scope: `marketplace-listing-content-${slug}`,
    source: listingContentSource,
    translate: translateMarketplaceListingContent,
  })
  const { data: displayGeneratedText } = useTranslatedIgnContent(generatedText, {
    enabled: Boolean(generatedText),
    lang,
    scope: `marketplace-listing-generated-${slug}`,
    source: generatedTextSource,
    translate: translatePlainContent,
  })

  if (!listing) {
    return (
      <section className="commerce-page section-padding">
        <div className="container commerce-shell">
          <nav className="commerce-breadcrumbs" aria-label={copy.breadcrumbLabel}>
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{copy.home}</a>
            <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>{copy.marketplace}</a>
          </nav>
          <div className="commerce-empty">
            <h1>{copy.listingNotFound}</h1>
            <p>{copy.listingUnavailable}</p>
            <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
              {copy.backToMarketplace}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <article className="commerce-page section-padding">
      <div className="container commerce-shell">
        <nav className="commerce-breadcrumbs" aria-label={copy.breadcrumbLabel}>
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{copy.home}</a>
          <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>{copy.marketplace}</a>
          <span>{displayListing.title}</span>
        </nav>

        <a className="commerce-back" href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
          <ArrowLeft size={16} />
          {copy.backToMarketplace}
        </a>

        <header className="commerce-hero">
          <div className="commerce-hero-media">
            <img src={listing.previewDataUrl} alt={`${copy.previewAlt} ${displayListing.title}`} loading="eager" decoding="async" />
          </div>
          <div className="commerce-hero-copy">
            <span><Handshake size={16} /> {p2pCategoryLabel(listing.category, t.p2p)}</span>
            <h1>{displayListing.title}</h1>
            <p>{displayListingContent.longDescription}</p>
            <div className="commerce-price-row">
              <strong>{formatP2PPrice(listing, lang)}</strong>
              <a href="/p2p" onClick={(event) => navigateInternally(event, '/p2p', onNavigate)}>
                {copy.openCheckout}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </header>

        <div className="commerce-detail-grid">
          <section className="commerce-wide">
            <h2>{copy.previewImages}</h2>
            <p>{copy.previewDescription}</p>
            <div className="commerce-gallery">
              {listingContent.previewImages.map((image, index) => (
                <img key={image} src={image} alt={`${displayListing.title} ${copy.previewImageAlt} ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              ))}
            </div>
          </section>

          <section>
            <h2>{copy.whatIncluded}</h2>
            <p>{displayGeneratedText.includedDescription}</p>
            <ul>
              {(displayListing.properties || []).map((property) => (
                <li key={property.key}><CheckCircle2 size={16} /> {property.key}: {property.value}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{copy.fileDetails}</h2>
            <p>{displayGeneratedText.fileDescription}</p>
            <ul>
              {(listing.files || []).map((file) => (
                <li key={file.name}><FileArchive size={16} /> {file.name} - {formatFileSize(file.size, lang)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{copy.license}</h2>
            <p>{displayListingContent.license}</p>
          </section>

          <section>
            <h2>{copy.sellerInformation}</h2>
            <p>{displayGeneratedText.sellerDescription}</p>
            <p className="commerce-note"><Store size={16} /> {copy.publicSeedListing}</p>
          </section>

          <section>
            <h2>{copy.deliveryRefund}</h2>
            <p>{displayGeneratedText.deliveryDescription}</p>
            <a href="/buyer-protection" onClick={(event) => navigateInternally(event, '/buyer-protection', onNavigate)}>
              {copy.buyerProtection}
              <ArrowRight size={15} />
            </a>
          </section>

          <section>
            <h2>{copy.unofficialFanListing}</h2>
            <p>{displayGeneratedText.unofficialDescription}</p>
            <p className="commerce-note"><ShieldCheck size={16} /> {copy.suspiciousNote}</p>
          </section>

          <section className="commerce-wide">
            <h2>{copy.faq}</h2>
            <div className="commerce-faq-list">
              {displayListingContent.faq.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="commerce-wide">
            <h2>{copy.relatedListings}</h2>
            <div className="commerce-related-list">
              {displayListingContent.relatedListings.map((related) => (
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
