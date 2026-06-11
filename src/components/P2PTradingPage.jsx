import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  BadgeDollarSign,
  Check,
  Copy,
  CreditCard,
  Edit3,
  FileArchive,
  Handshake,
  ImagePlus,
  Info,
  ListChecks,
  Loader2,
  MessageCircle,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  UploadCloud,
  Wallet,
  X,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import { PAYMENT_ADDRESS, PAYMENT_NETWORK, PAYMENT_NETWORK_SUFFIX, formatShopPrice } from '../shop/shopData'
import { checkUsdtTransaction, normalizeTxId } from '../shop/tronPayments'
import {
  P2P_CATEGORIES,
  P2P_PAYMENT_METHODS,
  formatFileSize,
  formatP2PPrice,
  p2pCategoryLabel,
  p2pPaymentMethodLabel,
} from '../p2p/p2pData'
import { uploadTelegramFiles } from '../p2p/telegramStorage'
import MessageConversationModal from './MessageConversationModal.jsx'
import './P2PTradingPage.css'

const MAX_LISTING_FILES = 8
const EMPTY_LISTINGS = []
const POLL_INTERVAL_MS = 3000
const PAYMENT_METHOD_DETAILS = P2P_PAYMENT_METHODS.reduce((details, method) => {
  details[method.id] = method.detail
  return details
}, {})
const USDT_CHECKOUT_CURRENCIES = new Set(['USD', 'USDT'])
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/
const FORM_SPRING = {
  type: 'spring',
  stiffness: 430,
  damping: 34,
  mass: 0.82,
  velocity: 2.6,
}
const FORM_EXIT_SPRING = {
  type: 'spring',
  stiffness: 560,
  damping: 40,
  mass: 0.72,
  velocity: -3,
}

function initialListingForm() {
  return {
    title: '',
    category: 'digital-assets',
    price: '',
    currency: 'USDT',
    cryptoWalletAddress: '',
    deliveryMethod: 'Telegram handoff',
    paymentMethods: ['crypto'],
    description: '',
  }
}

function initialProperties() {
  return [
    { key: 'Format', value: '' },
    { key: 'Platform', value: '' },
    { key: 'License', value: '' },
  ]
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the preview image.'))
    reader.readAsDataURL(file)
  })
}

function fileSelectionKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not render the preview image.'))
    image.src = src
  })
}

async function createPreviewDataUrl(file) {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const maxWidth = 960
  const maxHeight = 560
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const compressed = canvas.toDataURL('image/jpeg', 0.82)

  if (compressed.length > 700000) {
    throw new Error('Choose a smaller preview image.')
  }

  return compressed
}

function listingDateLabel(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Today'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function cleanProperties(properties) {
  return properties
    .map((property) => ({
      key: property.key.trim(),
      value: property.value.trim(),
    }))
    .filter((property) => property.key && property.value)
    .slice(0, 12)
}

function listingPaymentMethods(listing) {
  const methods = (listing.paymentMethods || []).filter((method) => {
    return P2P_PAYMENT_METHODS.some((paymentMethod) => paymentMethod.id === method)
  })

  if (methods.length) return methods
  return ['USDT', 'TRX'].includes(listing.currency) ? ['crypto'] : ['card']
}

function p2pUsdtPaymentAmount(listing) {
  return formatShopPrice(Number(listing.price) || 0)
}

function p2pPaymentAddress(listing) {
  return String(listing.cryptoWalletAddress || PAYMENT_ADDRESS).trim()
}

function canUseUsdtCheckout(listing) {
  const price = Number(listing.price)
  return (
    listingPaymentMethods(listing).includes('crypto') &&
    USDT_CHECKOUT_CURRENCIES.has(listing.currency || 'USD') &&
    Number.isFinite(price) &&
    price > 0
  )
}

function defaultP2PMessage(listing) {
  return `Hi, I am interested in your P2P listing "${listing.title}".`
}

function P2PListingCard({
  listing,
  seller,
  currentUserId,
  busy,
  management = false,
  onEdit,
  onDelete,
  onViewDetails,
  onMarkSold,
  onToggleStatus,
}) {
  const fileCount = listing.files?.length || 0
  const isSeller = currentUserId && currentUserId === listing.sellerId
  const isSold = listing.status === 'sold'
  const canViewDetails = !management && Boolean(onViewDetails)
  const openDetails = () => {
    if (canViewDetails) onViewDetails(listing)
  }
  const handleCardKeyDown = (event) => {
    if (!canViewDetails || !['Enter', ' '].includes(event.key)) return
    event.preventDefault()
    onViewDetails(listing)
  }
  const handleActionClick = (event, action) => {
    event.stopPropagation()
    if (action) action(listing)
  }

  return (
    <article
      className={`p2p-listing-card ${isSold ? 'sold' : ''} ${canViewDetails ? 'interactive' : ''}`}
      role={canViewDetails ? 'button' : undefined}
      tabIndex={canViewDetails ? 0 : undefined}
      onClick={openDetails}
      onKeyDown={handleCardKeyDown}
    >
      <div className="p2p-listing-media">
        {listing.previewDataUrl ? (
          <img src={listing.previewDataUrl} alt={listing.title} loading="lazy" decoding="async" />
        ) : (
          <div className="p2p-listing-placeholder" aria-hidden="true">
            <FileArchive size={34} />
          </div>
        )}
        <span className={`p2p-listing-status ${isSold ? 'sold' : ''}`}>
          {isSold ? 'Sold' : 'Active'}
        </span>
      </div>

      <div className="p2p-listing-body">
        <div className="p2p-listing-head">
          <span className="p2p-listing-category">
            <Tag size={13} />
            {p2pCategoryLabel(listing.category)}
          </span>
          <strong>{formatP2PPrice(listing)}</strong>
        </div>

        <h2>{listing.title}</h2>
        <p>{listing.description}</p>

        <div className="p2p-listing-properties">
          {(listing.properties || []).slice(0, 4).map((property) => (
            <span key={`${property.key}-${property.value}`}>
              <b>{property.key}</b>
              {property.value}
            </span>
          ))}
        </div>

        <div className="p2p-listing-meta">
          <span className="p2p-seller-chip">
            <span
              style={{ backgroundColor: `${seller?.avatarColor || '#00d9ff'}22`, color: seller?.avatarColor || '#00d9ff' }}
            >
              {(seller?.username || 'P2P').slice(0, 2).toUpperCase()}
            </span>
            {seller?.username || 'Seller'}
          </span>
          <span>{listingDateLabel(listing.createdAt)}</span>
        </div>

        <div className="p2p-file-strip">
          <FileArchive size={15} />
          {fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'} stored via Telegram` : 'Seller delivers after deal'}
        </div>

        {fileCount > 0 && (
          <div className="p2p-file-list" aria-label="Listing files">
            {listing.files.slice(0, 3).map((file) => (
              <span key={`${file.name}-${file.size}`}>
                {file.name}
                <small>{formatFileSize(file.size)}</small>
              </span>
            ))}
          </div>
        )}

        <div className="p2p-listing-actions">
          {management ? (
            <div className="p2p-management-actions">
              <button
                type="button"
                className="p2p-secondary-action"
                disabled={busy}
                onClick={(event) => handleActionClick(event, onEdit)}
              >
                <Edit3 size={15} />
                Edit
              </button>
              <button
                type="button"
                className="p2p-secondary-action"
                disabled={busy}
                onClick={(event) => handleActionClick(event, onToggleStatus)}
              >
                {busy ? (
                  <Loader2 size={15} className="p2p-spin" />
                ) : isSold ? (
                  <RefreshCw size={15} />
                ) : (
                  <Check size={15} />
                )}
                {isSold ? 'Set active' : 'Mark sold'}
              </button>
              <button
                type="button"
                className="p2p-danger-action"
                disabled={busy}
                onClick={(event) => handleActionClick(event, onDelete)}
              >
                {busy ? <Loader2 size={15} className="p2p-spin" /> : <Trash2 size={15} />}
                Remove
              </button>
            </div>
          ) : isSeller ? (
            <button
              type="button"
              className="p2p-secondary-action"
              disabled={isSold || busy}
              onClick={(event) => handleActionClick(event, onMarkSold)}
            >
              {busy ? <Loader2 size={15} className="p2p-spin" /> : <Check size={15} />}
              {isSold ? 'Sold' : 'Mark sold'}
            </button>
          ) : (
            <button
              type="button"
              className="p2p-primary-action"
              disabled={isSold || busy}
              onClick={(event) => handleActionClick(event, onViewDetails)}
            >
              {busy ? <Loader2 size={15} className="p2p-spin" /> : <BadgeDollarSign size={15} />}
              Buy
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function P2PUsdtCheckoutBox({ listing, onMessageSeller, panelRef }) {
  const [copiedField, setCopiedField] = useState('')
  const [txHash, setTxHash] = useState('')
  const [txIdToVerify, setTxIdToVerify] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  const paymentAmount = p2pUsdtPaymentAmount(listing)
  const receivingAddress = p2pPaymentAddress(listing)
  const isChecking = paymentStatus === 'pending'

  useEffect(() => {
    if (!txIdToVerify) return undefined

    let canceled = false
    let timerId

    const pollTransaction = async () => {
      try {
        const result = await checkUsdtTransaction(txIdToVerify, paymentAmount, receivingAddress)

        if (canceled) return

        setPaymentStatus(result.status)
        setPaymentMessage(result.message)

        if (result.status === 'pending') {
          timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
        }
      } catch (error) {
        if (canceled) return

        setPaymentStatus('pending')
        setPaymentMessage(error.message || 'TRONGrid is not responding. Checking again shortly.')
        timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
      }
    }

    pollTransaction()

    return () => {
      canceled = true
      window.clearTimeout(timerId)
    }
  }, [paymentAmount, receivingAddress, txIdToVerify])

  const copyPaymentValue = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(''), 1400)
    } catch (error) {
      console.log('Could not copy P2P checkout value:', error)
    }
  }

  const submitPaymentProof = () => {
    const normalizedTxId = normalizeTxId(txHash)
    if (!normalizedTxId) return

    setTxHash(normalizedTxId)
    setPaymentStatus('pending')
    setPaymentMessage('Checking TRON network...')
    setTxIdToVerify(normalizedTxId)
  }

  return (
    <div className="p2p-checkout-panel" ref={panelRef}>
      <div className="p2p-checkout-head">
        <ShieldCheck size={16} />
        <div>
          <h3>USDT TRC20 checkout</h3>
          <span>{PAYMENT_NETWORK} proof verification</span>
        </div>
      </div>

      <div className="p2p-checkout-values">
        <span>
          <b>Send exactly</b>
          <strong>{paymentAmount} USDT {PAYMENT_NETWORK_SUFFIX}</strong>
          <button type="button" onClick={() => copyPaymentValue(paymentAmount, 'amount')}>
            <Copy size={13} />
            {copiedField === 'amount' ? 'Copied' : 'Copy'}
          </button>
        </span>
        <span>
          <b>Receiving address</b>
          <code>{receivingAddress}</code>
          <button type="button" onClick={() => copyPaymentValue(receivingAddress, 'address')}>
            <Copy size={13} />
            {copiedField === 'address' ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>

      <label className="p2p-checkout-field">
        <span>Transaction hash</span>
        <input
          type="text"
          value={txHash}
          onChange={(event) => {
            setTxHash(event.target.value)
            setTxIdToVerify('')
            setPaymentStatus('idle')
            setPaymentMessage('')
          }}
          placeholder="Paste your TRC20 transaction hash"
        />
      </label>

      <button
        type="button"
        className="p2p-primary-action p2p-checkout-submit"
        disabled={!txHash.trim() || isChecking || paymentStatus === 'success'}
        onClick={submitPaymentProof}
      >
        {isChecking ? <Loader2 size={15} className="p2p-spin" /> : <ShieldCheck size={15} />}
        Verify hash
      </button>

      {paymentStatus !== 'idle' && (
        <div className={`p2p-checkout-status ${paymentStatus}`}>
          {paymentStatus === 'success' && <Check size={16} />}
          {paymentStatus === 'failed' && <AlertCircle size={16} />}
          {paymentStatus === 'pending' && <Loader2 size={16} className="p2p-spin" />}
          <div>
            <strong>
              {paymentStatus === 'success' && 'Payment verified'}
              {paymentStatus === 'failed' && 'Verification failed'}
              {paymentStatus === 'pending' && 'Checking payment'}
            </strong>
            <span>{paymentMessage}</span>
            {txIdToVerify && <code>{txIdToVerify}</code>}
          </div>
        </div>
      )}

      {paymentStatus === 'success' && (
        <button
          type="button"
          className="p2p-secondary-action p2p-checkout-message"
          onClick={() => onMessageSeller(listing, txIdToVerify)}
        >
          <MessageCircle size={15} />
          Message seller with proof
        </button>
      )}
    </div>
  )
}

function P2PProductDetailsModal({
  listing,
  seller,
  currentUserId,
  busy,
  onClose,
  onMessageSeller,
}) {
  const fileCount = listing.files?.length || 0
  const isSold = listing.status === 'sold'
  const isSeller = currentUserId && currentUserId === listing.sellerId
  const paymentMethods = listingPaymentMethods(listing)
  const showUsdtCheckout = !isSeller && !isSold && canUseUsdtCheckout(listing)
  const checkoutPanelRef = useRef(null)

  const handleBuyClick = () => {
    if (showUsdtCheckout && checkoutPanelRef.current) {
      checkoutPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => {
        checkoutPanelRef.current?.querySelector('input')?.focus({ preventScroll: true })
      }, 280)
      return
    }

    onMessageSeller(listing)
  }

  return (
    <div className="p2p-modal-backdrop" onClick={onClose}>
      <section
        className="p2p-product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2p-product-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p2p-modal-head">
          <div>
            <span className="p2p-kicker">
              <Info size={15} />
              Product details
            </span>
            <h2 id="p2p-product-details-title">{listing.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close product details">
            <X size={18} />
          </button>
        </div>

        <div className="p2p-modal-layout">
          <div className="p2p-modal-media">
            {listing.previewDataUrl ? (
              <img src={listing.previewDataUrl} alt={listing.title} />
            ) : (
              <div className="p2p-listing-placeholder" aria-hidden="true">
                <FileArchive size={42} />
              </div>
            )}
            <span className={`p2p-listing-status ${isSold ? 'sold' : ''}`}>
              {isSold ? 'Sold' : 'Active'}
            </span>
          </div>

          <div className="p2p-modal-summary">
            <div className="p2p-modal-price-row">
              <span className="p2p-listing-category">
                <Tag size={14} />
                {p2pCategoryLabel(listing.category)}
              </span>
              <strong>{formatP2PPrice(listing)}</strong>
            </div>

            <p>{listing.description || 'The seller can share extra context in chat before you make a deal.'}</p>

            <div className="p2p-modal-seller">
              <span
                style={{ backgroundColor: `${seller?.avatarColor || '#00d9ff'}22`, color: seller?.avatarColor || '#00d9ff' }}
              >
                {(seller?.username || 'P2P').slice(0, 2).toUpperCase()}
              </span>
              <div>
                <b>{seller?.username || 'Seller'}</b>
                <small>Listed {listingDateLabel(listing.createdAt)}</small>
              </div>
            </div>

            <div className="p2p-modal-payment-block">
              <h3>Payment options</h3>
              <div className="p2p-modal-payment-list">
                {paymentMethods.map((methodId) => (
                  <span key={methodId}>
                    {methodId === 'card' ? <CreditCard size={15} /> : <Wallet size={15} />}
                    <b>{p2pPaymentMethodLabel(methodId)}</b>
                    <small>{PAYMENT_METHOD_DETAILS[methodId]}</small>
                  </span>
                ))}
              </div>
            </div>

            {showUsdtCheckout && (
              <P2PUsdtCheckoutBox
                listing={listing}
                onMessageSeller={onMessageSeller}
                panelRef={checkoutPanelRef}
              />
            )}

            {isSeller ? (
              <div className="p2p-modal-note">This is your listing. Manage it from My Products.</div>
            ) : (
              <div className="p2p-modal-actions">
                <button
                  type="button"
                  className="p2p-primary-action"
                  disabled={isSold || busy}
                  onClick={handleBuyClick}
                >
                  {busy ? <Loader2 size={16} className="p2p-spin" /> : <BadgeDollarSign size={16} />}
                  Buy
                </button>
                <button
                  type="button"
                  className="p2p-secondary-action"
                  disabled={isSold || busy}
                  onClick={() => onMessageSeller(listing)}
                >
                  {busy ? <Loader2 size={16} className="p2p-spin" /> : <MessageCircle size={16} />}
                  Message seller
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p2p-modal-sections">
          <section>
            <h3>
              <ListChecks size={16} />
              What's included
            </h3>
            <div className="p2p-included-list">
              <span>
                <b>Delivery</b>
                {listing.deliveryMethod || 'Seller handoff after payment'}
              </span>
              <span>
                <b>Files</b>
                {fileCount ? `${fileCount} stored file${fileCount === 1 ? '' : 's'}` : 'No uploaded file bundle yet'}
              </span>
            </div>

            {fileCount > 0 && (
              <div className="p2p-modal-file-list">
                {listing.files.map((file) => (
                  <span key={`${file.name}-${file.size}-${file.messageId || file.fileUniqueId || ''}`}>
                    <FileArchive size={15} />
                    <b>{file.name}</b>
                    <small>{formatFileSize(file.size)}</small>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3>
              <Tag size={16} />
              Other properties
            </h3>
            <div className="p2p-detail-properties">
              {(listing.properties || []).map((property) => (
                <span key={`${property.key}-${property.value}`}>
                  <b>{property.key}</b>
                  {property.value}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function P2PTradingPage({ onOpenAuth = () => {} }) {
  const {
    state,
    usersById,
    currentProfile,
    isSignedIn,
    authLoading,
    clearBackendError,
    createP2PListing,
    updateP2PListing,
    updateP2PListingStatus,
    deleteP2PListing,
  } = useSocial()
  const [activeTab, setActiveTab] = useState('market')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(initialListingForm)
  const [properties, setProperties] = useState(initialProperties)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const [existingFiles, setExistingFiles] = useState([])
  const [listingFiles, setListingFiles] = useState([])
  const [editingListingId, setEditingListingId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [busyListingId, setBusyListingId] = useState('')
  const [selectedListingId, setSelectedListingId] = useState('')
  const [conversationListingId, setConversationListingId] = useState('')
  const [conversationDraft, setConversationDraft] = useState('')
  const [formResetKey, setFormResetKey] = useState(0)

  useEffect(() => {
    clearBackendError()
  }, [clearBackendError])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'P2P Trading | GTA VI Hub'

    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!selectedListingId) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') setSelectedListingId('')
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedListingId])

  const listings = state.p2pListings || EMPTY_LISTINGS
  const isEditing = Boolean(editingListingId)
  const currentProfileId = currentProfile?.id || ''
  const activeListingCount = listings.filter((listing) => listing.status !== 'sold').length
  const totalStoredFiles = listings.reduce((total, listing) => total + (listing.files?.length || 0), 0)
  const myListings = useMemo(() => {
    if (!currentProfileId) return EMPTY_LISTINGS

    return listings
      .filter((listing) => listing.sellerId === currentProfileId)
      .sort((first, second) => new Date(second.createdAt ?? 0) - new Date(first.createdAt ?? 0))
  }, [currentProfileId, listings])

  const selectedListing = useMemo(() => {
    return listings.find((listing) => listing.id === selectedListingId) || null
  }, [listings, selectedListingId])

  const conversationListing = useMemo(() => {
    return listings.find((listing) => listing.id === conversationListingId) || null
  }, [conversationListingId, listings])

  const filteredListings = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase()
    const baseListings = activeTab === 'mine' ? myListings : listings

    return baseListings
      .filter((listing) => {
        const seller = usersById[listing.sellerId]
        const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory
        const searchText = [
          listing.title,
          listing.description,
          listing.cryptoWalletAddress,
          p2pCategoryLabel(listing.category),
          ...listingPaymentMethods(listing).map(p2pPaymentMethodLabel),
          seller?.username,
          ...(listing.properties || []).flatMap((property) => [property.key, property.value]),
        ].join(' ').toLowerCase()

        return matchesCategory && (!cleanQuery || searchText.includes(cleanQuery))
      })
      .sort((first, second) => {
        if (first.status === 'sold' && second.status !== 'sold') return 1
        if (first.status !== 'sold' && second.status === 'sold') return -1
        return new Date(second.createdAt ?? 0) - new Date(first.createdAt ?? 0)
      })
  }, [activeTab, listings, myListings, searchQuery, selectedCategory, usersById])

  const updateFormField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const togglePaymentMethod = (methodId) => {
    setForm((currentForm) => {
      const currentMethods = currentForm.paymentMethods || []
      const paymentMethods = currentMethods.includes(methodId)
        ? currentMethods.filter((currentMethodId) => currentMethodId !== methodId)
        : [...currentMethods, methodId]

      return { ...currentForm, paymentMethods }
    })
  }

  const resetForm = () => {
    setForm(initialListingForm())
    setProperties(initialProperties())
    setPreviewFile(null)
    setPreviewDataUrl('')
    setExistingFiles([])
    setListingFiles([])
    setEditingListingId('')
    setUploadProgress('')
    setFormResetKey((key) => key + 1)
  }

  const closeForm = () => {
    setFormError('')
    setFormOpen(false)
  }

  const updateProperty = (index, field, value) => {
    setProperties((currentProperties) => {
      return currentProperties.map((property, propertyIndex) => {
        if (propertyIndex !== index) return property
        return { ...property, [field]: value }
      })
    })
  }

  const addProperty = () => {
    setProperties((currentProperties) => [...currentProperties, { key: '', value: '' }])
  }

  const removeProperty = (index) => {
    setProperties((currentProperties) => {
      if (currentProperties.length <= 1) return currentProperties
      return currentProperties.filter((_, propertyIndex) => propertyIndex !== index)
    })
  }

  const handlePreviewChange = async (event) => {
    const file = event.target.files?.[0] || null
    setPreviewFile(file)
    setPreviewDataUrl('')
    setFormError('')

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFormError('Choose an image file for the preview.')
      return
    }

    try {
      setPreviewDataUrl(await createPreviewDataUrl(file))
    } catch (error) {
      setFormError(error.message)
    }
  }

  const handleFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFormError('')
    if (!selectedFiles.length) return

    const availableSlots = Math.max(0, MAX_LISTING_FILES - existingFiles.length - listingFiles.length)

    if (!availableSlots) {
      setFormError('Remove an existing file before attaching another one.')
      event.target.value = ''
      return
    }

    const attachedFileKeys = new Set(listingFiles.map(fileSelectionKey))
    const newFiles = selectedFiles.filter((file) => !attachedFileKeys.has(fileSelectionKey(file)))

    if (!newFiles.length) {
      setFormError('Those files are already attached to this listing.')
      event.target.value = ''
      return
    }

    if (newFiles.length > availableSlots) {
      setFormError(`Attach up to ${availableSlots} new file${availableSlots === 1 ? '' : 's'} for this listing.`)
    }

    setListingFiles((currentFiles) => [...currentFiles, ...newFiles.slice(0, availableSlots)])
    event.target.value = ''
  }

  const removeExistingFile = (index) => {
    setFormError('')
    setExistingFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
  }

  const removeListingFile = (index) => {
    setFormError('')
    setListingFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleOpenForm = () => {
    setFormError('')
    setFormSuccess('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    if (formOpen && !isEditing) {
      closeForm()
      return
    }

    resetForm()
    setActiveTab('mine')
    setFormOpen(true)
  }

  const handleMyProductsTab = () => {
    setFormError('')
    setFormSuccess('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    setActiveTab('mine')
  }

  const handleEditListing = (listing) => {
    setActionNotice('')
    setFormError('')
    setFormSuccess('')
    setActiveTab('mine')
    setEditingListingId(listing.id)
    setForm({
      title: listing.title || '',
      category: listing.category || 'other',
      price: listing.price === undefined || listing.price === null ? '' : String(listing.price),
      currency: listing.currency || 'USDT',
      cryptoWalletAddress: listing.cryptoWalletAddress || '',
      deliveryMethod: listing.deliveryMethod || '',
      paymentMethods: listingPaymentMethods(listing),
      description: listing.description || '',
    })
    setProperties(listing.properties?.length ? listing.properties : initialProperties())
    setPreviewFile(null)
    setPreviewDataUrl(listing.previewDataUrl || '')
    setExistingFiles(listing.files || [])
    setListingFiles([])
    setUploadProgress('')
    setFormResetKey((key) => key + 1)
    setFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    setActionNotice('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    const title = form.title.trim()
    const price = Number(form.price)
    const nextProperties = cleanProperties(properties)
    const totalFileCount = existingFiles.length + listingFiles.length
    const paymentMethods = form.paymentMethods || []
    const cryptoWalletAddress = form.cryptoWalletAddress.trim()

    if (title.length < 3) {
      setFormError('Add a title with at least 3 characters.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError('Add a valid price.')
      return
    }

    if (!nextProperties.length) {
      setFormError('Add at least one property.')
      return
    }

    if (!paymentMethods.length) {
      setFormError('Choose at least one payment option.')
      return
    }

    if (paymentMethods.includes('crypto') && !TRON_ADDRESS_PATTERN.test(cryptoWalletAddress)) {
      setFormError('Add a valid USDT TRC20 wallet address.')
      return
    }

    if (totalFileCount > MAX_LISTING_FILES) {
      setFormError(`Keep the listing to ${MAX_LISTING_FILES} files or fewer.`)
      return
    }

    setSubmitting(true)

    try {
      let uploadedFiles = []

      if (listingFiles.length > 0) {
        uploadedFiles = await uploadTelegramFiles(
          listingFiles,
          { kind: isEditing ? 'p2p-listing-edit-file' : 'p2p-listing-file', title },
          ({ file, index, total }) => {
            setUploadProgress(`Uploading ${index + 1}/${total}: ${file.name}`)
          },
        )
      }

      const payload = {
        title,
        description: form.description,
        category: form.category,
        price,
        currency: form.currency || 'USDT',
        cryptoWalletAddress,
        deliveryMethod: form.deliveryMethod,
        paymentMethods,
        properties: nextProperties,
        previewDataUrl,
        files: [...existingFiles, ...uploadedFiles],
      }

      const saved = isEditing
        ? await updateP2PListing(editingListingId, payload)
        : await createP2PListing(payload)

      if (!saved) {
        throw new Error(isEditing ? 'Could not update the listing.' : 'Could not publish the listing.')
      }

      setFormOpen(false)
      setActiveTab('mine')
      setFormSuccess(isEditing ? 'Product updated.' : 'Listing published to the P2P market.')
    } catch (error) {
      setFormError(error.message || (isEditing ? 'Could not update the listing.' : 'Could not publish the listing.'))
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  const handleMessageSeller = (listing, paymentTxId = '') => {
    setActionNotice('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    if (currentProfileId === listing.sellerId) return

    setConversationDraft(paymentTxId
      ? `Hi, I paid for your P2P listing "${listing.title}" with USDT TRC20.\n\nTransaction hash: ${paymentTxId}`
      : '')
    setSelectedListingId('')
    setConversationListingId(listing.id)
  }

  const handleMarkSold = async (listing) => {
    setActionNotice('')
    setBusyListingId(listing.id)
    const updated = await updateP2PListingStatus(listing.id, 'sold')
    setBusyListingId('')
    setActionNotice(updated ? 'Listing marked as sold.' : 'Could not update the listing.')
  }

  const handleToggleListingStatus = async (listing) => {
    const nextStatus = listing.status === 'sold' ? 'active' : 'sold'
    setActionNotice('')
    setBusyListingId(listing.id)
    const updated = await updateP2PListingStatus(listing.id, nextStatus)
    setBusyListingId('')
    setActionNotice(updated ? `Listing marked as ${nextStatus}.` : 'Could not update the listing.')
  }

  const handleDeleteListing = async (listing) => {
    setActionNotice('')

    if (!window.confirm(`Remove "${listing.title}" from your products?`)) return

    setBusyListingId(listing.id)
    const deleted = await deleteP2PListing(listing.id)
    setBusyListingId('')
    setActionNotice(deleted ? 'Product removed.' : 'Could not remove the product.')

    if (deleted && editingListingId === listing.id) {
      closeForm()
    }
  }

  const handleViewListingDetails = (listing) => {
    if (activeTab !== 'market') return
    setSelectedListingId(listing.id)
  }

  return (
    <section className="p2p-page section-padding">
      <div className="container p2p-container">
        <header className="p2p-hero">
          <div className="p2p-hero-copy">
            <span className="p2p-kicker">
              <Handshake size={16} />
              P2P exchange
            </span>
            <h1>Trade GTA VI fan-made goods directly.</h1>
            <p>
              Buy and sell overlays, emotes, guides, services, collectibles, and other GTA VI related drops with
              seller-to-buyer messaging.
            </p>
          </div>

          <div className="p2p-hero-panel" aria-label="Marketplace summary">
            <div>
              <strong>{activeListingCount}</strong>
              <span>active listings</span>
            </div>
            <div>
              <strong>{totalStoredFiles}</strong>
              <span>stored files</span>
            </div>
            <div>
              <strong>{P2P_CATEGORIES.length}</strong>
              <span>trade lanes</span>
            </div>
          </div>
        </header>

        <div className="p2p-view-tabs" aria-label="P2P trading views">
          <button
            type="button"
            className={activeTab === 'market' ? 'active' : ''}
            onClick={() => setActiveTab('market')}
          >
            <Handshake size={16} />
            Marketplace
          </button>
          <button
            type="button"
            className={activeTab === 'mine' ? 'active' : ''}
            onClick={handleMyProductsTab}
          >
            <Store size={16} />
            My Products
            {isSignedIn && <span>{myListings.length}</span>}
          </button>
        </div>

        <div className="p2p-toolbar">
          <label className="p2p-search">
            <Search size={17} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search items, sellers, properties"
            />
          </label>

          <div className="p2p-category-tabs" aria-label="Marketplace categories">
            <button
              type="button"
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {P2P_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <button type="button" className="p2p-create-toggle" onClick={handleOpenForm} disabled={authLoading}>
            <PackagePlus size={17} />
            {formOpen && !isEditing ? 'Close form' : isSignedIn ? 'Create listing' : 'Sign in to sell'}
          </button>
        </div>

        {(formSuccess || actionNotice) && (
          <div className="p2p-status-line" aria-live="polite">
            {formSuccess || actionNotice}
          </div>
        )}

        <AnimatePresence
          initial={false}
          onExitComplete={() => {
            if (!formOpen) resetForm()
          }}
        >
          {formOpen && (
          <motion.form
            key="p2p-listing-form"
            layout
            className="p2p-listing-form"
            initial={{ opacity: 0, y: -22, scale: 0.975, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: FORM_SPRING }}
            exit={{ opacity: 0, y: -18, scale: 0.985, filter: 'blur(10px)', transition: FORM_EXIT_SPRING }}
            style={{ transformOrigin: 'top center' }}
            onSubmit={handleSubmit}
          >
            <div className="p2p-form-head">
              <div>
                <span className="p2p-kicker">
                  <BadgeDollarSign size={15} />
                  {isEditing ? 'Edit item' : 'New item'}
                </span>
                <h2>{isEditing ? 'Edit product listing' : 'Create a sale listing'}</h2>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close listing form">
                <X size={18} />
              </button>
            </div>

            <div className="p2p-form-grid">
              <label>
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) => updateFormField('title', event.target.value)}
                  placeholder="Vice City overlay source pack"
                  maxLength="90"
                />
              </label>

              <label>
                <span>Category</span>
                <select value={form.category} onChange={(event) => updateFormField('category', event.target.value)}>
                  {P2P_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateFormField('price', event.target.value)}
                  placeholder="24.99"
                />
              </label>

              <label>
                <span>Crypto wallet address</span>
                <input
                  value={form.cryptoWalletAddress}
                  onChange={(event) => updateFormField('cryptoWalletAddress', event.target.value)}
                  placeholder="USDT TRC20 wallet address"
                  maxLength="128"
                />
              </label>

              <div className="p2p-payment-field p2p-form-wide">
                <span>Payment options</span>
                <div className="p2p-payment-selector">
                  {P2P_PAYMENT_METHODS.map((method) => (
                    <label key={method.id}>
                      <input
                        type="checkbox"
                        checked={(form.paymentMethods || []).includes(method.id)}
                        onChange={() => togglePaymentMethod(method.id)}
                      />
                      {method.id === 'card' ? <CreditCard size={16} /> : <Wallet size={16} />}
                      <span>
                        <b>{method.label}</b>
                        <small>{method.detail}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="p2p-form-wide">
                <span>Delivery</span>
                <input
                  value={form.deliveryMethod}
                  onChange={(event) => updateFormField('deliveryMethod', event.target.value)}
                  placeholder="Telegram handoff, Discord delivery, local meetup"
                  maxLength="80"
                />
              </label>

              <label className="p2p-form-wide">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  placeholder="What is included, what the buyer gets, and how delivery works."
                  maxLength="520"
                />
              </label>
            </div>

            <div className="p2p-properties-editor">
              <div className="p2p-subhead">
                <h3>Properties</h3>
                <button type="button" onClick={addProperty}>
                  <Plus size={15} />
                  Add
                </button>
              </div>
              {properties.map((property, index) => (
                <div className="p2p-property-row" key={`property-${index}`}>
                  <input
                    value={property.key}
                    onChange={(event) => updateProperty(index, 'key', event.target.value)}
                    placeholder="Property"
                    maxLength="30"
                  />
                  <input
                    value={property.value}
                    onChange={(event) => updateProperty(index, 'value', event.target.value)}
                    placeholder="Value"
                    maxLength="64"
                  />
                  <button type="button" onClick={() => removeProperty(index)} aria-label="Remove property">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p2p-upload-grid">
              <div>
                <label className="p2p-upload-box">
                  <ImagePlus size={22} />
                  <span>Preview image</span>
                  <small>{previewFile ? previewFile.name : 'JPG, PNG, or WebP'}</small>
                  <input key={`preview-${formResetKey}`} type="file" accept="image/*" onChange={handlePreviewChange} />
                </label>
                {previewDataUrl && (
                  <img className="p2p-preview-thumb" src={previewDataUrl} alt="Listing preview" />
                )}
              </div>

              <div>
                <label className="p2p-upload-box">
                  <UploadCloud size={22} />
                  <span>Sale files</span>
                  <small>
                    {listingFiles.length
                      ? `${listingFiles.length} selected`
                      : isEditing
                        ? `${Math.max(0, MAX_LISTING_FILES - existingFiles.length)} slots available`
                        : 'Bundles, archives, sources'}
                  </small>
                  <input
                    key={`files-${formResetKey}`}
                    type="file"
                    multiple
                    disabled={existingFiles.length + listingFiles.length >= MAX_LISTING_FILES}
                    onChange={handleFilesChange}
                  />
                </label>
                {existingFiles.length > 0 && (
                  <div className="p2p-existing-files" aria-label="Stored listing files">
                    {existingFiles.map((file, index) => (
                      <div className="p2p-existing-file" key={`${file.name}-${file.size}-${index}`}>
                        <span>
                          {file.name}
                          <small>{formatFileSize(file.size)}</small>
                        </span>
                        <button type="button" onClick={() => removeExistingFile(index)} aria-label={`Remove ${file.name}`}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {listingFiles.length > 0 && (
                  <div className="p2p-selected-files">
                    {listingFiles.map((file, index) => (
                      <div className="p2p-selected-file" key={fileSelectionKey(file)}>
                        <span>
                          {file.name}
                          <small>{formatFileSize(file.size)}</small>
                        </span>
                        <button type="button" onClick={() => removeListingFile(index)} aria-label={`Remove ${file.name}`}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p2p-form-footer">
              <span>
                <ShieldCheck size={15} />
                Files are uploaded through the server-side Telegram bot connector.
              </span>
              <button type="submit" className="p2p-primary-action" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="p2p-spin" /> : <Check size={16} />}
                {submitting
                  ? uploadProgress || (isEditing ? 'Saving' : 'Publishing')
                  : isEditing ? 'Save changes' : 'Publish listing'}
              </button>
            </div>

            {formError && <div className="p2p-form-error" role="alert">{formError}</div>}
          </motion.form>
          )}
        </AnimatePresence>

        <div className="p2p-market-grid">
          {filteredListings.map((listing) => (
            <P2PListingCard
              key={listing.id}
              listing={listing}
              seller={usersById[listing.sellerId]}
              currentUserId={currentProfileId}
              busy={busyListingId === listing.id}
              management={activeTab === 'mine'}
              onEdit={handleEditListing}
              onDelete={handleDeleteListing}
              onViewDetails={handleViewListingDetails}
              onMarkSold={handleMarkSold}
              onToggleStatus={handleToggleListingStatus}
            />
          ))}
        </div>

        {!filteredListings.length && (
          <div className="p2p-empty">
            <FileArchive size={28} />
            <strong>{activeTab === 'mine' ? 'No products yet' : 'No listings found'}</strong>
            <span>
              {activeTab === 'mine'
                ? 'Create your first listing to manage it here.'
                : 'Try another category or search term.'}
            </span>
          </div>
        )}

        {selectedListing && (
          <P2PProductDetailsModal
            listing={selectedListing}
            seller={usersById[selectedListing.sellerId]}
            currentUserId={currentProfileId}
            busy={busyListingId === selectedListing.id}
            onClose={() => setSelectedListingId('')}
            onMessageSeller={handleMessageSeller}
          />
        )}

        {conversationListing && (
          <MessageConversationModal
            key={`${conversationListing.id}:${conversationDraft}`}
            recipient={usersById[conversationListing.sellerId]}
            contextLabel={conversationListing.title}
            initialBody={conversationDraft || defaultP2PMessage(conversationListing)}
            onClose={() => {
              setConversationListingId('')
              setConversationDraft('')
            }}
          />
        )}
      </div>
    </section>
  )
}

export default P2PTradingPage
