import { ArrowLeft, ArrowRight, CheckCircle2, FileArchive, MonitorPlay, ShieldCheck, ShoppingCart } from 'lucide-react'
import { SHOP_PRODUCT_BY_SLUG, formatShopPrice, getShopProductThumbnail } from '../shop/shopData'
import { getProductSeoContent } from '../content/products'
import { localizeShopProduct } from '../shop/shopLocalization'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './CommerceDetailPage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function ShopProductPage({ slug, onNavigate, onAddCartItem = () => {} }) {
  const { t, lang } = useTranslation()
  const product = SHOP_PRODUCT_BY_SLUG[slug]
  const shopCopy = { ...t.shop, lang }
  const displayProduct = product ? localizeShopProduct(product, shopCopy) : null

  if (!product || !displayProduct) {
    return (
      <section className="commerce-page section-padding">
        <div className="container commerce-shell">
          <nav className="commerce-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
            <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>Shop</a>
          </nav>
          <div className="commerce-empty">
            <h1>Product not found</h1>
            <p>This shop product is not available. Browse the current GTA VI-inspired overlay, emote, and profile banner packs.</p>
            <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>
              Back to shop
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  const thumbnail = getShopProductThumbnail(displayProduct)
  const productContent = getProductSeoContent(product)
  const previewImages = Array.from(new Set([
    thumbnail,
    ...(displayProduct.images || []),
  ].filter(Boolean))).slice(0, 4)

  return (
    <article className="commerce-page section-padding">
      <div className="container commerce-shell">
        <nav className="commerce-breadcrumbs" aria-label="Breadcrumb">
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
          <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>Shop</a>
          <span>{displayProduct.title}</span>
        </nav>

        <a className="commerce-back" href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>
          <ArrowLeft size={16} />
          Back to shop
        </a>

        <header className="commerce-hero">
          <div className="commerce-hero-media">
            <img src={thumbnail} alt={`Preview of ${displayProduct.title}`} loading="eager" decoding="async" />
          </div>
          <div className="commerce-hero-copy">
            <span><MonitorPlay size={16} /> {displayProduct.categoryLabel}</span>
            <h1>{displayProduct.title}</h1>
            <p>{productContent.description}</p>
            <div className="commerce-price-row">
              <strong>${formatShopPrice(product.price)}</strong>
              <button type="button" onClick={() => onAddCartItem(product)}>
                <ShoppingCart size={17} />
                Add to cart
              </button>
            </div>
          </div>
        </header>

        <div className="commerce-detail-grid">
          <section className="commerce-wide">
            <h2>Preview gallery</h2>
            <p>{productContent.galleryAlt}</p>
            <div className="commerce-gallery">
              {previewImages.map((image, index) => (
                <img key={image} src={image} alt={`${displayProduct.title} preview ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              ))}
            </div>
          </section>

          <section>
            <h2>What is included</h2>
            <p>
              This pack includes {displayProduct.format.toLowerCase()} built for a {displayProduct.resolution}
              {' '}creator workflow. The preview represents the style, composition, and delivery format.
            </p>
            <ul>
              {productContent.included.map((item) => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}
            </ul>
          </section>

          <section>
            <h2>File details</h2>
            <p>
              Delivery is a downloadable digital item from the Leonida Loot shop. The file name is
              {' '}{displayProduct.downloadFileName || 'provided after checkout'} and the format is {displayProduct.format}.
            </p>
            <ul>
              <li><FileArchive size={16} /> Resolution: {displayProduct.resolution}</li>
              <li><FileArchive size={16} /> Category: {displayProduct.categoryLabel}</li>
              <li><FileArchive size={16} /> Payment: USDT TRC20 checkout</li>
            </ul>
          </section>

          <section>
            <h2>License and usage</h2>
            <p>
              Use this fan-made asset in personal streams, community channels, and creator profiles.
              Do not resell, redistribute, claim official affiliation, or present the pack as Rockstar Games material.
            </p>
          </section>

          <section>
            <h2>Delivery and refund policy</h2>
            <p>
              Digital delivery starts after checkout confirmation. Review the refund policy before purchase,
              especially because downloaded digital files generally cannot be returned.
            </p>
            <a href="/refund-policy" onClick={(event) => navigateInternally(event, '/refund-policy', onNavigate)}>
              Refund policy
              <ArrowRight size={15} />
            </a>
          </section>

          <section>
            <h2>Unofficial fan asset</h2>
            <p>
              Leonida Loot is not affiliated with Rockstar Games or Take-Two Interactive. This product is a
              community-made creator asset inspired by Leonida and Vice City themes.
            </p>
            <p className="commerce-note"><ShieldCheck size={16} /> No official game files or leaked assets are included.</p>
          </section>

          <section className="commerce-wide">
            <h2>FAQ</h2>
            <div className="commerce-faq-list">
              {productContent.faq.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="commerce-wide">
            <h2>Related products</h2>
            <div className="commerce-related-list">
              {productContent.relatedProducts.map((related) => (
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

export default ShopProductPage
