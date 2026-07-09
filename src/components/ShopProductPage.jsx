import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FileArchive, MonitorPlay, ShieldCheck, ShoppingCart } from 'lucide-react'
import { SHOP_PRODUCT_BY_SLUG, formatShopPrice, getShopProductThumbnail } from '../shop/shopData'
import { getProductSeoContent } from '../content/products'
import { localizeShopProduct } from '../shop/shopLocalization'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './CommerceDetailPage.css'

const SHOP_DETAIL_CHROME = {
  breadcrumbLabel: 'Breadcrumb',
  home: 'Home',
  shop: 'Shop',
  productNotFound: 'Product not found',
  productUnavailable: 'This shop product is not available. Browse the current GTA VI-inspired overlay, emote, and profile banner packs.',
  backToShop: 'Back to shop',
  addToCart: 'Add to cart',
  productDetails: 'Product details',
  previewGallery: 'Preview gallery',
  whatIncluded: 'What is included',
  fileDetails: 'File details',
  licenseUsage: 'License and usage',
  deliveryRefund: 'Delivery and refund policy',
  refundPolicy: 'Refund policy',
  unofficialFanAsset: 'Unofficial fan asset',
  faq: 'FAQ',
  relatedProducts: 'Related products',
  resolution: 'Resolution',
  category: 'Category',
  payment: 'Payment',
  usdtCheckout: 'USDT TRC20 checkout',
  providedAfterCheckout: 'provided after checkout',
  noOfficialFiles: 'No official game files or leaked assets are included.',
  previewAlt: 'Preview of',
  previewImageAlt: 'preview',
}
const SHOP_DETAIL_CHROME_TRANSLATION_OPTIONS = {
  keys: [
    'addToCart',
    'backToShop',
    'breadcrumbLabel',
    'category',
    'deliveryRefund',
    'faq',
    'fileDetails',
    'home',
    'includedFiles',
    'licenseUsage',
    'noOfficialFiles',
    'payment',
    'previewAlt',
    'previewGallery',
    'previewImageAlt',
    'productDetails',
    'productNotFound',
    'productUnavailable',
    'providedAfterCheckout',
    'refundPolicy',
    'relatedProducts',
    'resolution',
    'shop',
    'unofficialFanAsset',
    'usdtCheckout',
    'whatIncluded',
  ],
}

function translateShopDetailChrome(data, lang) {
  return translatePlainContent(data, lang, SHOP_DETAIL_CHROME_TRANSLATION_OPTIONS)
}

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
  const productContent = product ? getProductSeoContent(product) : null
  const chromeSource = useMemo(() => plainContentTranslationSource(SHOP_DETAIL_CHROME, SHOP_DETAIL_CHROME_TRANSLATION_OPTIONS), [])
  const productContentSource = useMemo(() => (productContent ? plainContentTranslationSource(productContent) : null), [productContent])
  const generatedText = useMemo(() => {
    if (!product) return null

    return {
      includedDescription: `This pack includes ${product.format.toLowerCase()} built for a ${product.resolution} creator workflow. The preview represents the style, composition, and delivery format.`,
      fileDescription: `Delivery is a downloadable digital item from the Leonida Loot shop. The file name is ${product.downloadFileName || SHOP_DETAIL_CHROME.providedAfterCheckout} and the format is ${product.format}.`,
      licenseDescription: 'Use this fan-made asset in personal streams, community channels, and creator profiles. Do not resell, redistribute, claim official affiliation, or present the pack as Rockstar Games material.',
      deliveryDescription: 'Digital delivery starts after checkout confirmation. Review the refund policy before purchase, especially because downloaded digital files generally cannot be returned.',
      unofficialDescription: 'Leonida Loot is not affiliated with Rockstar Games or Take-Two Interactive. This product is a community-made creator asset inspired by Leonida and Vice City themes.',
    }
  }, [product])
  const generatedTextSource = useMemo(() => (generatedText ? plainContentTranslationSource(generatedText) : null), [generatedText])
  const { data: detailCopy } = useTranslatedIgnContent(SHOP_DETAIL_CHROME, {
    lang,
    scope: 'shop-product-detail-chrome',
    source: chromeSource,
    translate: translateShopDetailChrome,
  })
  const { data: displayProductContent } = useTranslatedIgnContent(productContent, {
    enabled: Boolean(productContent),
    lang,
    scope: `shop-product-content-${slug}`,
    source: productContentSource,
    translate: translatePlainContent,
  })
  const { data: displayGeneratedText } = useTranslatedIgnContent(generatedText, {
    enabled: Boolean(generatedText),
    lang,
    scope: `shop-product-generated-${slug}`,
    source: generatedTextSource,
    translate: translatePlainContent,
  })

  if (!product || !displayProduct) {
    return (
      <section className="commerce-page section-padding">
        <div className="container commerce-shell">
          <nav className="commerce-breadcrumbs" aria-label={detailCopy.breadcrumbLabel}>
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{detailCopy.home}</a>
            <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>{detailCopy.shop}</a>
          </nav>
          <div className="commerce-empty">
            <h1>{detailCopy.productNotFound}</h1>
            <p>{detailCopy.productUnavailable}</p>
            <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>
              {detailCopy.backToShop}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  const thumbnail = getShopProductThumbnail(displayProduct)
  const previewImages = Array.from(new Set([
    thumbnail,
    ...(displayProduct.images || []),
  ].filter(Boolean))).slice(0, 4)

  return (
    <article className="commerce-page section-padding">
      <div className="container commerce-shell">
        <nav className="commerce-breadcrumbs" aria-label={detailCopy.breadcrumbLabel}>
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{detailCopy.home}</a>
          <a href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>{detailCopy.shop}</a>
          <span>{displayProduct.title}</span>
        </nav>

        <a className="commerce-back" href="/shop" onClick={(event) => navigateInternally(event, '/shop', onNavigate)}>
          <ArrowLeft size={16} />
          {detailCopy.backToShop}
        </a>

        <header className="commerce-hero">
          <div className="commerce-hero-media">
            <img src={thumbnail} alt={`${detailCopy.previewAlt} ${displayProduct.title}`} loading="eager" decoding="async" />
          </div>
          <div className="commerce-hero-copy">
            <span><MonitorPlay size={16} /> {displayProduct.categoryLabel}</span>
            <h1>{displayProduct.title}</h1>
            <p>{displayProductContent.description}</p>
            <div className="commerce-price-row">
              <strong>${formatShopPrice(product.price)}</strong>
              <button type="button" onClick={() => onAddCartItem(product)}>
                <ShoppingCart size={17} />
                {detailCopy.addToCart}
              </button>
            </div>
          </div>
        </header>

        <div className="commerce-detail-grid">
          <section className="commerce-wide commerce-editorial-copy">
            <h2>{detailCopy.productDetails}</h2>
            {displayProductContent.longCopy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>

          {displayProductContent.detailSections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section className="commerce-wide">
            <h2>{detailCopy.previewGallery}</h2>
            <p>{displayProductContent.galleryAlt}</p>
            <div className="commerce-gallery">
              {previewImages.map((image, index) => (
                <img key={image} src={image} alt={`${displayProduct.title} ${detailCopy.previewImageAlt} ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              ))}
            </div>
          </section>

          <section>
            <h2>{detailCopy.whatIncluded}</h2>
            <p>{displayGeneratedText.includedDescription}</p>
            <ul>
              {displayProductContent.included.map((item) => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}
            </ul>
          </section>

          <section>
            <h2>{detailCopy.fileDetails}</h2>
            <p>{displayGeneratedText.fileDescription}</p>
            <ul>
              <li><FileArchive size={16} /> {detailCopy.resolution}: {displayProduct.resolution}</li>
              <li><FileArchive size={16} /> {detailCopy.category}: {displayProduct.categoryLabel}</li>
              <li><FileArchive size={16} /> {detailCopy.payment}: {detailCopy.usdtCheckout}</li>
            </ul>
          </section>

          <section>
            <h2>{detailCopy.licenseUsage}</h2>
            <p>{displayGeneratedText.licenseDescription}</p>
          </section>

          <section>
            <h2>{detailCopy.deliveryRefund}</h2>
            <p>{displayGeneratedText.deliveryDescription}</p>
            <a href="/refund-policy" onClick={(event) => navigateInternally(event, '/refund-policy', onNavigate)}>
              {detailCopy.refundPolicy}
              <ArrowRight size={15} />
            </a>
          </section>

          <section>
            <h2>{detailCopy.unofficialFanAsset}</h2>
            <p>{displayGeneratedText.unofficialDescription}</p>
            <p className="commerce-note"><ShieldCheck size={16} /> {detailCopy.noOfficialFiles}</p>
          </section>

          <section className="commerce-wide">
            <h2>{detailCopy.faq}</h2>
            <div className="commerce-faq-list">
              {displayProductContent.faq.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="commerce-wide">
            <h2>{detailCopy.relatedProducts}</h2>
            <div className="commerce-related-list">
              {displayProductContent.relatedProducts.map((related) => (
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
