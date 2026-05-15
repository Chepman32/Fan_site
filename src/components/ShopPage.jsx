import { useEffect, useState } from 'react'
import { Check, MonitorPlay, PackageCheck, ShoppingCart, Sparkles, Wallet, X } from 'lucide-react'
import CryptoCheckoutPanel from './CryptoCheckoutPanel'
import ProductPreviewModal from './ProductPreviewModal'
import { SHOP_PRODUCTS_BY_CATEGORY, categoryTabs } from '../shop/shopData'
import './ShopPage.css'

function ShopProductArtwork({ product, loading = 'eager' }) {
  if (product.images?.length > 1) {
    return (
      <span className="shop-emote-pack-preview" aria-hidden="true">
        {product.images.map((image) => (
          <img key={image} src={image} alt="" loading={loading} draggable="false" />
        ))}
      </span>
    )
  }

  return (
    <img
      src={product.image}
      alt={product.title}
      loading={loading}
      draggable="false"
    />
  )
}

function ShopPage({ cartItems = [], cartTotal = 0, onAddCartItem = () => {}, onRemoveCartItem = () => {} }) {
  const defaultProducts = SHOP_PRODUCTS_BY_CATEGORY['stream-overlays'] || []
  const [selectedCategory, setSelectedCategory] = useState('stream-overlays')
  const [featuredId, setFeaturedId] = useState(defaultProducts[0]?.id || '')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [previewProduct, setPreviewProduct] = useState(null)
  const products = SHOP_PRODUCTS_BY_CATEGORY[selectedCategory] || []
  const selectedCategoryMeta = categoryTabs.find((category) => category.id === selectedCategory)
  const checkoutKey = `${cartItems.map((item) => item.id).join(',')}:${cartTotal}`

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Shop | GTA VI Hub'

    return () => {
      document.title = previousTitle
    }
  }, [])

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

  const featuredProduct = products.find((product) => product.id === featuredId) || products[0]
  const activeFeaturedId = featuredProduct?.id

  const openCheckout = () => {
    setPaymentOpen(true)
  }

  const selectCategory = (categoryId) => {
    const nextProducts = SHOP_PRODUCTS_BY_CATEGORY[categoryId] || []
    setSelectedCategory(categoryId)
    setFeaturedId(nextProducts[0]?.id || '')
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
              Creator asset shop
            </span>
            <h1>Stream-ready GTA VI assets</h1>
            <p>
              Leonida-styled overlays, profile banners, and emote packs for fan streams, community pages, and creator channels.
            </p>
          </div>

          <div className="shop-cart-summary" aria-label="Cart summary">
            <span>
              <ShoppingCart size={18} />
              {cartItems.length} items
            </span>
            <strong>${cartTotal}</strong>
          </div>
        </header>

        <div className="shop-tabs" aria-label="Shop categories">
          {categoryTabs.map((category) => (
            <button
              key={category.id}
              type="button"
              className={selectedCategory === category.id ? 'active' : ''}
              disabled={!category.active}
              onClick={() => selectCategory(category.id)}
            >
              <span>{category.label}</span>
              <em>{category.active ? category.count : 'Soon'}</em>
            </button>
          ))}
        </div>

        {selectedCategoryMeta && (
          <div className="shop-category-strip">
            <strong>{selectedCategoryMeta.count}</strong>
            <span>{selectedCategoryMeta.label} available</span>
          </div>
        )}

        {featuredProduct && (
          <article className={`shop-featured ${featuredProduct.categoryId}`}>
            <button
              type="button"
              className="shop-featured-media"
              style={{ aspectRatio: featuredProduct.aspectRatio }}
              onClick={() => openProductPreview(featuredProduct)}
              onContextMenu={preventPreviewContextMenu}
              aria-label={`Open ${featuredProduct.title} fullscreen preview`}
            >
              <ShopProductArtwork product={featuredProduct} />
            </button>
            <div className="shop-featured-copy">
              <span className="shop-pack-label">
                <MonitorPlay size={15} />
                Featured {featuredProduct.categoryLabel}
              </span>
              <h2>{featuredProduct.title}</h2>
              <div className="shop-featured-specs">
                <span>{featuredProduct.format}</span>
                <span>{featuredProduct.resolution}</span>
                <span>{featuredProduct.tags[0]}</span>
              </div>
              <div className="shop-featured-actions">
                <button type="button" className="shop-buy-button" onClick={() => onAddCartItem(featuredProduct)}>
                  <ShoppingCart size={16} />
                  Add ${featuredProduct.price}
                </button>
                <button type="button" className="shop-preview-link" onClick={() => openProductPreview(featuredProduct)}>
                  Preview fullscreen
                </button>
              </div>
            </div>
          </article>
        )}

        <div className="shop-main">
          <div className="shop-products-grid">
            {products.map((product) => {
              const inCart = cartItems.some((item) => item.id === product.id)

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
                    aria-label={`Preview ${product.title}`}
                  >
                    <ShopProductArtwork product={product} loading="lazy" />
                  </button>

                  <div className="shop-product-body">
                    <div>
                      <h3>{product.title}</h3>
                      <p>{product.format} / {product.resolution}</p>
                    </div>
                    <strong>${product.price}</strong>
                  </div>

                  <div className="shop-product-tags">
                    {product.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`shop-card-action ${inCart ? 'selected' : ''}`}
                    onClick={() => (inCart ? removeCartItem(product.id) : onAddCartItem(product))}
                  >
                    {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                    {inCart ? 'Added' : 'Add to cart'}
                  </button>
                </article>
              )
            })}
          </div>

          <aside className="shop-cart-panel">
            <div className="shop-cart-heading">
              <PackageCheck size={18} />
              <h2>Order stack</h2>
            </div>

            {cartItems.length ? (
              <div className="shop-cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="shop-cart-item">
                    <img src={item.image} alt="" aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>${item.price}</span>
                    </div>
                    <button type="button" onClick={() => removeCartItem(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="shop-cart-empty">No assets selected yet.</p>
            )}

            <div className="shop-cart-total">
              <span>Total</span>
              <strong>${cartTotal}</strong>
            </div>
            <button type="button" className="shop-checkout-button" disabled={!cartItems.length} onClick={openCheckout}>
              <Wallet size={16} />
              Pay with USDT
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
            aria-label="Crypto checkout"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="shop-checkout-modal-head">
              <div>
                <span>Secure USDT checkout</span>
                <strong>${cartTotal}</strong>
              </div>
              <button type="button" aria-label="Close checkout" onClick={() => setPaymentOpen(false)}>
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
        product={previewProduct}
        inCart={Boolean(previewProduct && cartItems.some((item) => item.id === previewProduct.id))}
        onAddToCart={onAddCartItem}
        onClose={() => setPreviewProduct(null)}
      />
    </section>
  )
}

export default ShopPage
