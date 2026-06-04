import { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Check,
  Edit3,
  FileArchive,
  Handshake,
  ImagePlus,
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
  X,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import {
  P2P_CATEGORIES,
  P2P_CURRENCIES,
  formatFileSize,
  formatP2PPrice,
  p2pCategoryLabel,
} from '../p2p/p2pData'
import { uploadTelegramFiles } from '../p2p/telegramStorage'
import './P2PTradingPage.css'

const MAX_LISTING_FILES = 8
const EMPTY_LISTINGS = []

function initialListingForm() {
  return {
    title: '',
    category: 'digital-assets',
    price: '',
    currency: 'USD',
    deliveryMethod: 'Telegram handoff',
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

function P2PListingCard({
  listing,
  seller,
  currentUserId,
  busy,
  management = false,
  onEdit,
  onDelete,
  onMessageSeller,
  onMarkSold,
  onToggleStatus,
}) {
  const fileCount = listing.files?.length || 0
  const isSeller = currentUserId && currentUserId === listing.sellerId
  const isSold = listing.status === 'sold'

  return (
    <article className={`p2p-listing-card ${isSold ? 'sold' : ''}`}>
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
                onClick={() => onEdit(listing)}
              >
                <Edit3 size={15} />
                Edit
              </button>
              <button
                type="button"
                className="p2p-secondary-action"
                disabled={busy}
                onClick={() => onToggleStatus(listing)}
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
                onClick={() => onDelete(listing)}
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
              onClick={() => onMarkSold(listing)}
            >
              {busy ? <Loader2 size={15} className="p2p-spin" /> : <Check size={15} />}
              {isSold ? 'Sold' : 'Mark sold'}
            </button>
          ) : (
            <button
              type="button"
              className="p2p-primary-action"
              disabled={isSold || busy}
              onClick={() => onMessageSeller(listing)}
            >
              {busy ? <Loader2 size={15} className="p2p-spin" /> : <MessageCircle size={15} />}
              Message seller
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function P2PTradingPage({ onOpenAuth = () => {} }) {
  const {
    state,
    usersById,
    currentProfile,
    isSignedIn,
    authLoading,
    backendError,
    createP2PListing,
    updateP2PListing,
    updateP2PListingStatus,
    deleteP2PListing,
    sendMessage,
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
  const [formResetKey, setFormResetKey] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'P2P Trading | GTA VI Hub'

    return () => {
      document.title = previousTitle
    }
  }, [])

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
          p2pCategoryLabel(listing.category),
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
    resetForm()
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
    const files = Array.from(event.target.files || [])
    setFormError('')
    const availableSlots = Math.max(0, MAX_LISTING_FILES - existingFiles.length)

    if (!availableSlots) {
      setFormError('Remove an existing file before attaching another one.')
      setListingFiles([])
      return
    }

    if (files.length > availableSlots) {
      setFormError(`Attach up to ${availableSlots} new file${availableSlots === 1 ? '' : 's'} for this listing.`)
    }

    setListingFiles(files.slice(0, availableSlots))
  }

  const removeExistingFile = (index) => {
    setFormError('')
    setExistingFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
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
      currency: listing.currency || 'USD',
      deliveryMethod: listing.deliveryMethod || '',
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
        currency: form.currency,
        deliveryMethod: form.deliveryMethod,
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

      resetForm()
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

  const handleMessageSeller = async (listing) => {
    setActionNotice('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    if (currentProfileId === listing.sellerId) return

    setBusyListingId(listing.id)
    const sent = await sendMessage({
      toId: listing.sellerId,
      body: `Hi, I am interested in your P2P listing "${listing.title}".`,
    })
    setBusyListingId('')
    setActionNotice(sent ? 'Message sent to the seller.' : 'Could not send the message.')
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

        {(formSuccess || actionNotice || backendError) && (
          <div className="p2p-status-line" aria-live="polite">
            {formSuccess || actionNotice || backendError}
          </div>
        )}

        {formOpen && (
          <form className="p2p-listing-form" onSubmit={handleSubmit}>
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
                <span>Currency</span>
                <select value={form.currency} onChange={(event) => updateFormField('currency', event.target.value)}>
                  {P2P_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </label>

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
                    disabled={existingFiles.length >= MAX_LISTING_FILES}
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
                    {listingFiles.map((file) => (
                      <span key={`${file.name}-${file.size}`}>
                        {file.name}
                        <small>{formatFileSize(file.size)}</small>
                      </span>
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
          </form>
        )}

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
              onMessageSeller={handleMessageSeller}
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
      </div>
    </section>
  )
}

export default P2PTradingPage
