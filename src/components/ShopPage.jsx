import { useEffect, useState } from 'react'
import { Check, MonitorPlay, PackageCheck, ShoppingCart, Sparkles, Wallet } from 'lucide-react'
import CryptoCheckoutPanel from './CryptoCheckoutPanel'
import { STREAM_OVERLAY_PRODUCTS, categoryTabs } from '../shop/shopData'
import './ShopPage.css'

function ShopPage({ cartItems = [], cartTotal = 0, onAddCartItem = () => {}, onRemoveCartItem = () => {} }) {
  const products = STREAM_OVERLAY_PRODUCTS
  const [selectedCategory, setSelectedCategory] = useState('stream-overlays')
  const [featuredId, setFeaturedId] = useState(products[0]?.id || '')
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Shop | GTA VI Hub'

    return () => {
      document.title = previousTitle
    }
  }, [])

  const featuredProduct = products.find((product) => product.id === featuredId) || products[0]

  const openCheckout = () => {
    setPaymentOpen(true)
  }

  const removeCartItem = (productId) => {
    if (cartItems.length <= 1 && cartItems.some((item) => item.id === productId)) {
      setPaymentOpen(false)
    }
    onRemoveCartItem(productId)
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
              Leonida-styled overlays for fan streams, trailer watch parties, countdowns, and community broadcasts.
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
              onClick={() => setSelectedCategory(category.id)}
            >
              <span>{category.label}</span>
              <em>{category.active ? category.count : 'Soon'}</em>
            </button>
          ))}
        </div>

        {featuredProduct && (
          <article className="shop-featured">
            <div className="shop-featured-media">
              <img src={featuredProduct.image} alt={featuredProduct.title} />
            </div>
            <div className="shop-featured-copy">
              <span className="shop-pack-label">
                <MonitorPlay size={15} />
                Featured overlay pack
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
                <a href={featuredProduct.image} target="_blank" rel="noopener noreferrer" className="shop-preview-link">
                  Preview PNG
                </a>
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
                  className={`shop-product-card ${featuredId === product.id ? 'featured' : ''}`}
                >
                  <button
                    type="button"
                    className="shop-product-preview"
                    onClick={() => setFeaturedId(product.id)}
                    aria-label={`Preview ${product.title}`}
                  >
                    <img src={product.image} alt={product.title} loading="lazy" />
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

            {paymentOpen && cartItems.length > 0 && (
              <CryptoCheckoutPanel
                cartItems={cartItems}
                cartTotal={cartTotal}
                onRemoveItem={removeCartItem}
              />
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

export default ShopPage
