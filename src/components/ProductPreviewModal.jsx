import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingCart, X } from 'lucide-react'
import { formatShopPrice } from '../shop/shopData'
import './ProductPreviewModal.css'

const backdropTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
const sheetSpring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }

function ProductPreviewModal({ product, cartProduct = product, inCart, onAddToCart, onClose, copy = {} }) {
  const hasImageSet = product?.images?.length > 1

  const preventPreviewContextMenu = (event) => {
    event.preventDefault()
  }

  useEffect(() => {
    if (!product) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, product])

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key={product.id}
          className="product-preview-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
        >
          <motion.button
            type="button"
            className="product-preview-backdrop"
            aria-label={copy.preview?.closePreview || 'Close preview'}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />

          <motion.article
            className="product-preview-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={copy.previewFullscreen?.(product.title) || `${product.title} fullscreen preview`}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.42 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 720) onClose()
            }}
            onContextMenu={preventPreviewContextMenu}
            initial={{ y: 90, scale: 0.94, opacity: 0, borderRadius: 34 }}
            animate={{ y: 0, scale: 1, opacity: 1, borderRadius: 22 }}
            exit={{ y: 140, scale: 0.96, opacity: 0 }}
            transition={sheetSpring}
          >
            <div className="product-preview-handle" aria-hidden="true" />

            <header className="product-preview-header">
              <div>
                <span>{product.previewLabel || copy.preview?.productPreview || 'Product preview'}</span>
                <h2>{product.title}</h2>
              </div>
              <button type="button" className="product-preview-close" onClick={onClose} aria-label={copy.preview?.closePreview || 'Close preview'}>
                <X size={20} />
              </button>
            </header>

            <div className="product-preview-stage">
              {hasImageSet ? (
                <motion.div
                  className="product-preview-emote-grid"
                  initial={{ scale: 1.04, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...sheetSpring, delay: 0.04 }}
                >
                  {product.images.map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt=""
                      width="360"
                      height="360"
                      loading="eager"
                      decoding="async"
                      aria-hidden="true"
                      onContextMenu={preventPreviewContextMenu}
                      draggable="false"
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.img
                  src={product.image}
                  alt={product.title}
                  loading="eager"
                  decoding="async"
                  onContextMenu={preventPreviewContextMenu}
                  initial={{ scale: 1.05, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...sheetSpring, delay: 0.04 }}
                  draggable="false"
                />
              )}
            </div>

            <footer className="product-preview-footer">
              <div className="product-preview-meta">
                <strong>${formatShopPrice(product.price)}</strong>
                <span>{product.format}</span>
                <span>{product.resolution}</span>
              </div>
              <div className="product-preview-tags">
                {product.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button
                type="button"
                className={`product-preview-cart ${inCart ? 'selected' : ''}`}
                onClick={() => onAddToCart(cartProduct)}
              >
                {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                {inCart ? copy.addedToCart || 'Added to cart' : copy.addToCart || 'Add to cart'}
              </button>
            </footer>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProductPreviewModal
