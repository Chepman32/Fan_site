import { useEffect, useState } from 'react'
import { Check, MonitorPlay, PackageCheck, ShoppingCart, Sparkles, Wallet, X } from 'lucide-react'
import CryptoCheckoutPanel from './CryptoCheckoutPanel'
import ProductPreviewModal from './ProductPreviewModal'
import ShopLineItemThumbnail from './ShopLineItemThumbnail'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { PAYMENT_NETWORK_SUFFIX, SHOP_PRODUCTS_BY_CATEGORY, categoryTabs, formatShopPrice } from '../shop/shopData'
import { localizeShopProduct } from '../shop/shopLocalization'
import './ShopPage.css'

function ShopProductArtwork({ product, loading = 'eager' }) {
  if (product.previewImage) {
    return (
      <img
        className="shop-pack-sheet-preview"
        src={product.previewImage}
        alt={product.title}
        width="960"
        height="540"
        loading={loading}
        decoding="async"
        draggable="false"
      />
    )
  }

  if (product.images?.length > 1) {
    return (
      <span className={`shop-emote-pack-preview ${product.images.length > 10 ? 'dense' : ''}`} aria-hidden="true">
        {product.images.map((image) => (
          <img
            key={image}
            src={image}
            alt=""
            width="360"
            height="360"
            loading={loading}
            decoding="async"
            draggable="false"
          />
        ))}
      </span>
    )
  }

  return (
    <img
      src={product.image}
      alt={product.title}
      loading={loading}
      decoding="async"
      draggable="false"
    />
  )
}

function getMiddleProduct(products) {
  return products[Math.floor(products.length / 2)] || null
}

function ShopPage({ cartItems = [], cartTotal = 0, onAddCartItem = () => {}, onRemoveCartItem = () => {} }) {
  const { t, lang } = useTranslation()
  const shopCopy = { ...t.shop, lang }
  const defaultProducts = SHOP_PRODUCTS_BY_CATEGORY['stream-overlays'] || []
  const [selectedCategory, setSelectedCategory] = useState('stream-overlays')
  const [featuredId, setFeaturedId] = useState(getMiddleProduct(defaultProducts)?.id || '')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [previewProduct, setPreviewProduct] = useState(null)
  const products = SHOP_PRODUCTS_BY_CATEGORY[selectedCategory] || []
  const checkoutKey = `${cartItems.map((item) => item.id).join(',')}:${cartTotal}`

  useEffect(() => {
    if (!paymentOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPaymentOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [paymentOpen])

  const featuredProduct = products.find((product) => product.id === featuredId) || getMiddleProduct(products)
  const displayFeaturedProduct = localizeShopProduct(featuredProduct, shopCopy)
  const activeFeaturedId = featuredProduct?.id

  const openCheckout = () => {
    setPaymentOpen(true)
  }

  const selectCategory = (categoryId) => {
    const nextProducts = SHOP_PRODUCTS_BY_CATEGORY[categoryId] || []
    setSelectedCategory(categoryId)
    setFeaturedId(getMiddleProduct(nextProducts)?.id || '')
  }

  const removeCartItem = (productId) => {
    if (cartItems.length <= 1 && cartItems.some((item) => item.id === productId)) {
      setPaymentOpen(false)
    }
    onRemoveCartItem(productId)
  }

  const openProductPreview = (product) => {
    setFeaturedId(product.id)
    setPreviewProduct(product)
  }

  const preventPreviewContextMenu = (event) => {
    event.preventDefault()
  }

  return (
    <section className="shop-page section-padding">
      <div className="container shop-container">
        <header className="shop-header">
          <div>
            <span className="shop-kicker">
              <Sparkles size={15} />
              {shopCopy.kicker}
            </span>
            <h1>{shopCopy.heading}</h1>
            <p>{shopCopy.description}</p>
          </div>

          <div className="shop-cart-summary" aria-label={shopCopy.cartSummaryLabel}>
            <span>
              <ShoppingCart size={18} />
              {shopCopy.itemCount(cartItems.length)}
            </span>
            <strong>${formatShopPrice(cartTotal)}</strong>
          </div>
        </header>

        <div className="shop-tabs" aria-label={shopCopy.categoriesLabel}>
          {categoryTabs.map((category) => (
            <button
              key={category.id}
              type="button"
              className={selectedCategory === category.id ? 'active' : ''}
              disabled={!category.active}
              onClick={() => selectCategory(category.id)}
            >
              <span>{shopCopy.categories?.[category.id] || category.label}</span>
            </button>
          ))}
        </div>

        {featuredProduct && (
          <article className={`shop-featured ${featuredProduct.categoryId}`}>
            <button
              type="button"
              className="shop-featured-media"
              style={{ aspectRatio: featuredProduct.aspectRatio }}
              onClick={() => openProductPreview(featuredProduct)}
              onContextMenu={preventPreviewContextMenu}
              aria-label={shopCopy.openPreview(displayFeaturedProduct.title)}
            >
              <ShopProductArtwork product={displayFeaturedProduct} />
            </button>
            <div className="shop-featured-copy">
              <span className="shop-pack-label">
                <MonitorPlay size={15} />
                {shopCopy.featured} {displayFeaturedProduct.categoryLabel}
              </span>
              <h2>{displayFeaturedProduct.title}</h2>
              <div className="shop-featured-specs">
                <span>{displayFeaturedProduct.format}</span>
                <span>{displayFeaturedProduct.resolution}</span>
                <span>{displayFeaturedProduct.tags[0]}</span>
              </div>
              <div className="shop-featured-actions">
                <button type="button" className="shop-buy-button" onClick={() => onAddCartItem(featuredProduct)}>
                  <ShoppingCart size={16} />
                  {shopCopy.addPrice(formatShopPrice(featuredProduct.price))}
                </button>
              </div>
            </div>
          </article>
        )}

        <div className="shop-main">
          <div className="shop-products-grid">
            {products.map((product) => {
              const inCart = cartItems.some((item) => item.id === product.id)
              const displayProduct = localizeShopProduct(product, shopCopy)

              return (
                <article
                  key={product.id}
                  className={`shop-product-card ${product.categoryId} ${activeFeaturedId === product.id ? 'featured' : ''}`}
                >
                  <button
                    type="button"
                    className="shop-product-preview"
                    style={{ aspectRatio: product.aspectRatio }}
                    onClick={() => openProductPreview(product)}
                    onContextMenu={preventPreviewContextMenu}
                    aria-label={shopCopy.previewProduct(displayProduct.title)}
                  >
                    <ShopProductArtwork product={displayProduct} loading="lazy" />
                  </button>

                  <div className="shop-product-body">
                    <div>
                      <h3>{displayProduct.title}</h3>
                      <p>{displayProduct.format} / {displayProduct.resolution}</p>
                    </div>
                    <strong>${formatShopPrice(product.price)}</strong>
                  </div>

                  <div className="shop-product-tags">
                    {displayProduct.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`shop-card-action ${inCart ? 'selected' : ''}`}
                    onClick={() => (inCart ? removeCartItem(product.id) : onAddCartItem(product))}
                  >
                    {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                    {inCart ? shopCopy.added : shopCopy.addToCart}
                  </button>
                </article>
              )
            })}
          </div>

          <aside className="shop-cart-panel">
            <div className="shop-cart-heading">
              <PackageCheck size={18} />
              <h2>{shopCopy.orderStack}</h2>
            </div>

            {cartItems.length ? (
              <div className="shop-cart-items">
                {cartItems.map((item) => {
                  const displayItem = localizeShopProduct(item, shopCopy)

                  return (
                    <div key={item.id} className="shop-cart-item">
                      <ShopLineItemThumbnail product={item} />
                      <div>
                        <strong>{displayItem.title}</strong>
                        <span>${formatShopPrice(item.price)}</span>
                      </div>
                      <button type="button" onClick={() => removeCartItem(item.id)}>
                        {shopCopy.remove}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="shop-cart-empty">{shopCopy.emptyCart}</p>
            )}

            <div className="shop-cart-total">
              <span>{shopCopy.total}</span>
              <strong>${formatShopPrice(cartTotal)}</strong>
            </div>
            <button type="button" className="shop-checkout-button" disabled={!cartItems.length} onClick={openCheckout}>
              <Wallet size={16} />
              {shopCopy.payWithUsdt} {PAYMENT_NETWORK_SUFFIX}
            </button>
          </aside>
        </div>
      </div>

      {paymentOpen && cartItems.length > 0 && (
        <div className="shop-checkout-overlay" role="presentation" onMouseDown={() => setPaymentOpen(false)}>
          <div
            className="shop-checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-label={shopCopy.cryptoCheckout}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="shop-checkout-modal-head">
              <div>
                <span>{shopCopy.secureCheckout}</span>
                <strong>${formatShopPrice(cartTotal)}</strong>
              </div>
              <button type="button" aria-label={shopCopy.closeCheckout} onClick={() => setPaymentOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <CryptoCheckoutPanel
              key={checkoutKey}
              cartItems={cartItems}
              cartTotal={cartTotal}
              onRemoveItem={removeCartItem}
              wide
            />
          </div>
        </div>
      )}

      <ProductPreviewModal
        product={localizeShopProduct(previewProduct, shopCopy)}
        cartProduct={previewProduct}
        inCart={Boolean(previewProduct && cartItems.some((item) => item.id === previewProduct.id))}
        onAddToCart={onAddCartItem}
        onClose={() => setPreviewProduct(null)}
        copy={shopCopy}
      />
    </section>
  )
}

export default ShopPage
