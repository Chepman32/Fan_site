import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import {
  AlertCircle,
  BadgeDollarSign,
  Check,
  Copy,
  Edit3,
  FileArchive,
  Handshake,
  ImagePlus,
  Info,
  ListChecks,
  Loader2,
  MessageCircle,
  PackagePlus,
  PlugZap,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import {
  P2P_COMMISSION_PERCENT_LABEL,
  P2P_COMMISSION_RATE,
  P2P_PLATFORM_USDT_ADDRESS,
  PAYMENT_NETWORK,
  PAYMENT_NETWORK_SUFFIX,
  formatShopPrice,
  formatUsdtAmount,
} from '../shop/shopData'
import { connectTronLinkWallet, normalizeTxId, sendUsdtTransfer } from '../shop/tronPayments'
import {
  P2P_CATEGORIES,
  formatFileSize,
  formatP2PPrice,
  p2pCategoryLabel,
  p2pPaymentMethodLabel,
} from '../p2p/p2pData'
import { settleP2PUsdtPayment } from '../p2p/p2pPayouts'
import { uploadTelegramFiles } from '../p2p/telegramStorage'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { p2pTranslations } from '../i18n/p2pTranslations.js'
import MessageConversationModal from './MessageConversationModal.jsx'
import './P2PTradingPage.css'

const MAX_LISTING_FILES = 8
const EMPTY_LISTINGS = []
const POLL_INTERVAL_MS = 3000
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
const CONFIRM_SPRING = {
  type: 'spring',
  stiffness: 520,
  damping: 30,
  mass: 0.76,
  velocity: 3.8,
}
const CONFIRM_EXIT_SPRING = {
  type: 'spring',
  stiffness: 620,
  damping: 42,
  mass: 0.66,
  velocity: -2.8,
}
const P2P_TRUST_COPY = {
  kicker: 'Buyer protection',
  title: 'Buyer protection and marketplace trust',
  description: 'The P2P marketplace is for unofficial GTA VI-inspired creator goods, not official Rockstar files, leaks, ripped assets, or impersonation material.',
  listLabel: 'Buyer protection checkpoints',
  points: [
    'Exact USDT TRC20 amount and transaction hash are recorded for review.',
    'Listing description, seller messages, file notes, and delivery method remain visible during a dispute.',
    'Reports can flag missing delivery, materially different files, malware, stolen art, or impersonation.',
  ],
  sections: [
    {
      title: 'How buying works',
      body: 'Open a listing, review the preview and file details, message the seller if anything is unclear, then use the USDT TRC20 checkout flow only when the price, delivery method, and license are understood.',
    },
    {
      title: 'How sellers deliver files',
      body: 'Sellers attach or hand off creator-owned files through the listing and messaging workflow. Delivery notes should state formats, file size, license, and whether extra customization is included.',
    },
    {
      title: 'Buyer protection',
      body: 'Buyers should keep transaction hashes, listing screenshots, and message history. Suspicious files, missing delivery, or mismatched descriptions can be reported for review.',
    },
    {
      title: 'Dispute window',
      body: 'Use marketplace messages quickly after purchase if delivery is missing or materially different from the listing. Clear records help operators review disputes.',
    },
    {
      title: 'Prohibited content',
      body: 'No official Rockstar files, GTA VI leaks, ripped game assets, stolen art, malware, impersonation, account sales, or misleading claims of affiliation are allowed.',
    },
  ],
}
const P2P_TRUST_TRANSLATION_OPTIONS = {
  keys: ['kicker', 'listLabel'],
}
const P2P_LISTING_TRANSLATION_OPTIONS = {
  onlyKeys: ['title', 'description', 'deliveryMethod', 'key', 'value'],
}

function translateP2PTrustCopy(data, lang) {
  return translatePlainContent(data, lang, P2P_TRUST_TRANSLATION_OPTIONS)
}

function translateP2PListings(data, lang) {
  return translatePlainContent(data, lang, P2P_LISTING_TRANSLATION_OPTIONS)
}

const FORM_SEEDS = {
  en: { deliveryMethod: 'Telegram handoff', properties: ['Format', 'Platform', 'License'] },
  zh: { deliveryMethod: 'Telegram 交付', properties: ['格式', '平台', '授权'] },
  ru: { deliveryMethod: 'Передача через Telegram', properties: ['Формат', 'Платформа', 'Лицензия'] },
  it: { deliveryMethod: 'Consegna via Telegram', properties: ['Formato', 'Piattaforma', 'Licenza'] },
  id: { deliveryMethod: 'Serah terima Telegram', properties: ['Format', 'Platform', 'Lisensi'] },
  pl: { deliveryMethod: 'Przekazanie przez Telegram', properties: ['Format', 'Platforma', 'Licencja'] },
  hi: { deliveryMethod: 'Telegram handoff', properties: ['फॉर्मैट', 'प्लेटफॉर्म', 'लाइसेंस'] },
  ms: { deliveryMethod: 'Serahan Telegram', properties: ['Format', 'Platform', 'Lesen'] },
}

function formSeed(lang) {
  return FORM_SEEDS[lang] || FORM_SEEDS.en
}

function initialListingForm(lang = 'en') {
  return {
    title: '',
    category: 'digital-assets',
    price: '',
    cryptoWalletAddress: '',
    deliveryMethod: formSeed(lang).deliveryMethod,
    description: '',
  }
}

function initialProperties(lang = 'en') {
  return formSeed(lang).properties.map((key) => ({ key, value: '' }))
}

function sanitizePriceInput(value) {
  const normalized = String(value ?? '').replace(',', '.').replace(/[^\d.]/g, '')
  const decimalIndex = normalized.indexOf('.')
  const wholePart = (decimalIndex === -1 ? normalized : normalized.slice(0, decimalIndex))
    .replace(/^0+(?=\d)/, '')

  if (decimalIndex === -1) return wholePart

  const decimalPart = normalized.slice(decimalIndex + 1).replace(/\./g, '').slice(0, 2)
  return `${wholePart || '0'}.${decimalPart}`
}

function fixedPriceInput(value) {
  if (value === '' || value === null || value === undefined) return ''
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price.toFixed(2) : String(value)
}

function readFileAsDataUrl(file, copy) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(copy.errors.readPreview))
    reader.readAsDataURL(file)
  })
}

function fileSelectionKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function loadImage(src, copy) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(copy.errors.renderPreview))
    image.src = src
  })
}

async function createPreviewDataUrl(file, copy) {
  const dataUrl = await readFileAsDataUrl(file, copy)
  const image = await loadImage(dataUrl, copy)
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
    throw new Error(copy.errors.smallerPreview)
  }

  return compressed
}

function listingDateLabel(dateValue, lang, copy) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return copy.today

  return new Intl.DateTimeFormat(lang || 'en', {
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

function p2pUsdtPaymentAmount(listing) {
  return formatShopPrice(Number(listing.price) || 0)
}

function p2pCommissionAmount(listing) {
  const price = Number(listing.price) || 0
  return Math.floor(price * P2P_COMMISSION_RATE * 1_000_000) / 1_000_000
}

function p2pSellerPayoutAmount(listing) {
  const price = Number(listing.price) || 0
  return Math.max(0, price - p2pCommissionAmount(listing))
}

function p2pPaymentAddress() {
  return P2P_PLATFORM_USDT_ADDRESS
}

function legacyP2PMessageBodies(listing) {
  return Object.values(p2pTranslations).map((translation) => translation.messages.default(listing.title))
}

function shortenAddress(value = '') {
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-6)}`
}

function P2PListingCard({
  listing,
  displayListing = listing,
  seller,
  currentUserId,
  copy,
  lang,
  busy,
  management = false,
  onEdit,
  onDelete,
  onBuy,
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
          <img src={listing.previewDataUrl} alt={displayListing.title} loading="lazy" decoding="async" />
        ) : (
          <div className="p2p-listing-placeholder" aria-hidden="true">
            <FileArchive size={34} />
          </div>
        )}
        <span className={`p2p-listing-status ${isSold ? 'sold' : ''}`}>
          {isSold ? copy.status.sold : copy.status.active}
        </span>
      </div>

      <div className="p2p-listing-body">
        <div className="p2p-listing-head">
          <span className="p2p-listing-category">
            <Tag size={13} />
            {p2pCategoryLabel(listing.category, copy)}
          </span>
          <strong>{formatP2PPrice(listing, lang)}</strong>
        </div>

        <h2>{displayListing.title}</h2>
        <p>{displayListing.description}</p>

        <div className="p2p-listing-properties">
          {(displayListing.properties || []).slice(0, 4).map((property, index) => (
            <span key={`${property.key}-${property.value}-${index}`}>
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
            {seller?.username || copy.sellerFallback}
          </span>
          <span>{listingDateLabel(listing.createdAt, lang, copy)}</span>
        </div>

        <div className="p2p-file-strip">
          <FileArchive size={15} />
          {fileCount ? copy.card.storedViaTelegram(fileCount) : copy.card.sellerDelivers}
        </div>

        {fileCount > 0 && (
          <div className="p2p-file-list" aria-label={copy.card.listingFilesLabel}>
            {listing.files.slice(0, 3).map((file) => (
              <span key={`${file.name}-${file.size}`}>
                {file.name}
                <small>{formatFileSize(file.size, lang)}</small>
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
                {copy.actions.edit}
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
                {isSold ? copy.actions.setActive : copy.actions.markSold}
              </button>
              <button
                type="button"
                className="p2p-danger-action"
                disabled={busy}
                onClick={(event) => handleActionClick(event, onDelete)}
              >
                {busy ? <Loader2 size={15} className="p2p-spin" /> : <Trash2 size={15} />}
                {copy.actions.remove}
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
              {isSold ? copy.status.sold : copy.actions.markSold}
            </button>
          ) : (
            <button
              type="button"
              className="p2p-primary-action"
              disabled={isSold || busy}
              onClick={(event) => handleActionClick(event, onBuy)}
            >
              {busy ? <Loader2 size={15} className="p2p-spin" /> : <BadgeDollarSign size={15} />}
              {copy.actions.buy}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function P2PUsdtCheckoutBox({ listing, displayListing = listing, isSignedIn, copy, onRequireAuth, onMessageSeller }) {
  const { t } = useTranslation()
  const shopCheckoutCopy = t.shop.checkout
  const [copiedField, setCopiedField] = useState('')
  const [txHash, setTxHash] = useState('')
  const [txIdToVerify, setTxIdToVerify] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [payoutTxId, setPayoutTxId] = useState('')
  const [walletAccount, setWalletAccount] = useState('')
  const [walletTronWeb, setWalletTronWeb] = useState(null)
  const [walletStatus, setWalletStatus] = useState('idle')
  const [walletMessage, setWalletMessage] = useState('')
  const [qrSrc, setQrSrc] = useState('')
  const paymentAmount = p2pUsdtPaymentAmount(listing)
  const receivingAddress = p2pPaymentAddress()
  const commissionAmount = formatUsdtAmount(p2pCommissionAmount(listing))
  const sellerPayoutAmount = formatUsdtAmount(p2pSellerPayoutAmount(listing))
  const isChecking = paymentStatus === 'pending'
  const walletBusy = walletStatus === 'connecting' || walletStatus === 'sending'

  useEffect(() => {
    let canceled = false

    QRCode.toDataURL(receivingAddress, {
      width: 164,
      margin: 1,
      color: { dark: '#0a0a0f', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!canceled) setQrSrc(dataUrl)
      })
      .catch((error) => {
        console.log('Could not generate P2P checkout QR:', error)
      })

    return () => {
      canceled = true
    }
  }, [receivingAddress])

  useEffect(() => {
    if (!txIdToVerify) return undefined

    let canceled = false
    let timerId

    const pollTransaction = async () => {
      try {
        const result = await settleP2PUsdtPayment({
          listingId: listing.id,
          txId: txIdToVerify,
        })

        if (canceled) return

        setPaymentStatus(result.status === 'success' ? 'success' : 'pending')
        setPaymentMessage(result.message || copy.checkout.messages.checkingNetwork)
        setPayoutTxId(result.payoutTxId || '')

        if (result.status === 'pending') {
          timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
        }
      } catch (error) {
        if (canceled) return

        setPaymentStatus('failed')
        setPaymentMessage(error.message || copy.checkout.messages.verifyFailed)
      }
    }

    pollTransaction()

    return () => {
      canceled = true
      window.clearTimeout(timerId)
    }
  }, [copy, listing.id, txIdToVerify])

  const copyPaymentValue = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(''), 1400)
    } catch (error) {
      console.log('Could not copy P2P checkout value:', error)
    }
  }

  const connectWallet = async () => {
    setWalletStatus('connecting')
    setWalletMessage('')

    try {
      const connection = await connectTronLinkWallet()
      setWalletAccount(connection.account)
      setWalletTronWeb(connection.tronWeb)
      setWalletStatus('connected')
      return connection
    } catch (error) {
      setWalletStatus('failed')
      setWalletMessage(error.message || shopCheckoutCopy.messages.walletFailed)
      throw error
    }
  }

  const sendPaymentWithTronLink = async () => {
    if (!isSignedIn) {
      onRequireAuth()
      return
    }

    setPaymentStatus('pending')
    setPaymentMessage(shopCheckoutCopy.messages.confirmWallet)

    try {
      const connection = walletTronWeb && walletAccount
        ? { tronWeb: walletTronWeb, account: walletAccount }
        : await connectWallet()
      setWalletStatus('sending')
      const sentTxId = await sendUsdtTransfer(connection.tronWeb, paymentAmount, receivingAddress)
      setWalletStatus('connected')
      setTxHash(sentTxId)
      setTxIdToVerify(sentTxId)
      setPaymentMessage(shopCheckoutCopy.messages.transferSubmitted)
    } catch (error) {
      setWalletStatus('failed')
      setPaymentStatus('failed')
      setPaymentMessage(error.message || shopCheckoutCopy.messages.transferNotSubmitted)
    }
  }

  const submitPaymentProof = () => {
    if (!isSignedIn) {
      setPaymentStatus('failed')
      setPaymentMessage(copy.checkout.messages.signIn)
      onRequireAuth()
      return
    }

    const normalizedTxId = normalizeTxId(txHash)
    if (!normalizedTxId) return

    setTxHash(normalizedTxId)
    setPayoutTxId('')
    setPaymentStatus('pending')
    setPaymentMessage(copy.checkout.messages.preparing)
    setTxIdToVerify(normalizedTxId)
  }

  return (
    <div className="p2p-checkout-panel">
      <div className="p2p-checkout-head">
        <ShieldCheck size={18} />
        <div>
          <h3>{copy.checkout.title}</h3>
          <span>{copy.checkout.subtitle(PAYMENT_NETWORK)}</span>
        </div>
      </div>

      <div className="p2p-checkout-summary">
        <div className="p2p-checkout-item">
          {listing.previewDataUrl ? (
            <img src={listing.previewDataUrl} alt="" aria-hidden="true" />
          ) : (
            <span aria-hidden="true"><FileArchive size={24} /></span>
          )}
          <div>
            <strong>{displayListing.title}</strong>
            <small>{paymentAmount} USDT</small>
          </div>
        </div>

        <div className="p2p-checkout-total">
          <span>{t.shop.total}</span>
          <strong>{paymentAmount} USDT</strong>
        </div>

        <div className="p2p-checkout-qr-row">
          <div className="p2p-checkout-qr">
            {qrSrc ? <img src={qrSrc} alt={shopCheckoutCopy.qrAlt(PAYMENT_NETWORK)} decoding="async" /> : <span>QR</span>}
          </div>
          <p>{shopCheckoutCopy.qrNote}</p>
        </div>

        <div className="p2p-checkout-breakdown">
          <span><b>{copy.checkout.commission}</b><strong>{commissionAmount} USDT ({P2P_COMMISSION_PERCENT_LABEL})</strong></span>
          <span><b>{copy.checkout.sellerPayout}</b><strong>{sellerPayoutAmount} USDT</strong></span>
        </div>
      </div>

      <div className="p2p-checkout-payment">
        <div className="p2p-checkout-values">
          <span>
            <b>{copy.checkout.sendExactly}</b>
            <strong>{paymentAmount} USDT {PAYMENT_NETWORK_SUFFIX}</strong>
            <button type="button" onClick={() => copyPaymentValue(paymentAmount, 'amount')}>
              <Copy size={13} />
              {copiedField === 'amount' ? copy.actions.copied : copy.actions.copy}
            </button>
          </span>
          <span>
            <b>{copy.checkout.platformAddress}</b>
            <code>{receivingAddress}</code>
            <button type="button" onClick={() => copyPaymentValue(receivingAddress, 'address')}>
              <Copy size={13} />
              {copiedField === 'address' ? copy.actions.copied : copy.actions.copy}
            </button>
          </span>
        </div>

        <div className="p2p-checkout-wallet">
          <div>
            <PlugZap size={16} />
            <span>
              <small>{shopCheckoutCopy.tronLinkAutomation}</small>
              <strong>{walletAccount ? shortenAddress(walletAccount) : shopCheckoutCopy.walletNotConnected}</strong>
            </span>
          </div>
          <div>
            <button type="button" onClick={() => connectWallet().catch(() => {})} disabled={walletBusy || isChecking}>
              {walletStatus === 'connecting' ? shopCheckoutCopy.connecting : walletAccount ? shopCheckoutCopy.reconnect : shopCheckoutCopy.connectTronLink}
            </button>
            <button
              type="button"
              className="primary"
              onClick={sendPaymentWithTronLink}
              disabled={walletBusy || isChecking || paymentStatus === 'success'}
            >
              <Send size={14} />
              {walletStatus === 'sending' ? shopCheckoutCopy.openTronLink : shopCheckoutCopy.sendUsdt}
            </button>
          </div>
          {walletMessage && <p>{walletMessage}</p>}
        </div>

        <p className="p2p-checkout-warning">{shopCheckoutCopy.warning}</p>

        <label className="p2p-checkout-field">
          <span>{copy.checkout.txHash}</span>
          <input
            type="text"
            value={txHash}
            onChange={(event) => {
              setTxHash(event.target.value)
              setTxIdToVerify('')
              setPayoutTxId('')
              setPaymentStatus('idle')
              setPaymentMessage('')
            }}
            placeholder={copy.checkout.txPlaceholder}
          />
        </label>

        <button
          type="button"
          className="p2p-primary-action p2p-checkout-submit"
          disabled={!txHash.trim() || isChecking || paymentStatus === 'success'}
          onClick={submitPaymentProof}
        >
          {isChecking ? <Loader2 size={15} className="p2p-spin" /> : <ShieldCheck size={15} />}
          {copy.checkout.verifyHash}
        </button>

        {paymentStatus !== 'idle' && (
          <div className={`p2p-checkout-status ${paymentStatus}`}>
            {paymentStatus === 'success' && <Check size={16} />}
            {paymentStatus === 'failed' && <AlertCircle size={16} />}
            {paymentStatus === 'pending' && <Loader2 size={16} className="p2p-spin" />}
            <div>
              <strong>
                {paymentStatus === 'success' && copy.checkout.statuses.success}
                {paymentStatus === 'failed' && copy.checkout.statuses.failed}
                {paymentStatus === 'pending' && copy.checkout.statuses.pending}
              </strong>
              <span>{paymentMessage}</span>
              {txIdToVerify && <code>{txIdToVerify}</code>}
              {payoutTxId && <code>{payoutTxId}</code>}
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <button
            type="button"
            className="p2p-secondary-action p2p-checkout-message"
            onClick={() => onMessageSeller(listing, txIdToVerify, payoutTxId)}
          >
            <MessageCircle size={15} />
            {copy.checkout.messageProof}
          </button>
        )}
      </div>
    </div>
  )
}

function P2PCheckoutModal({ listing, displayListing = listing, isSignedIn, copy, onClose, onRequireAuth, onMessageSeller }) {
  return (
    <div className="p2p-checkout-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="p2p-checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-label={copy.checkout.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="p2p-checkout-close"
          aria-label={copy.modal.closeProductDetails}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <P2PUsdtCheckoutBox
          listing={listing}
          displayListing={displayListing}
          isSignedIn={isSignedIn}
          copy={copy}
          onRequireAuth={onRequireAuth}
          onMessageSeller={onMessageSeller}
        />
      </section>
    </div>
  )
}

function P2PProductDetailsModal({
  listing,
  displayListing = listing,
  seller,
  currentUserId,
  copy,
  lang,
  busy,
  onClose,
  onBuy,
  onMessageSeller,
}) {
  const fileCount = listing.files?.length || 0
  const isSold = listing.status === 'sold'
  const isSeller = currentUserId && currentUserId === listing.sellerId

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
              {copy.modal.productDetails}
            </span>
            <h2 id="p2p-product-details-title">{displayListing.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.modal.closeProductDetails}>
            <X size={18} />
          </button>
        </div>

        <div className="p2p-modal-layout">
          <div className="p2p-modal-media">
            {listing.previewDataUrl ? (
              <img src={listing.previewDataUrl} alt={displayListing.title} decoding="async" />
            ) : (
              <div className="p2p-listing-placeholder" aria-hidden="true">
                <FileArchive size={42} />
              </div>
            )}
            <span className={`p2p-listing-status ${isSold ? 'sold' : ''}`}>
              {isSold ? copy.status.sold : copy.status.active}
            </span>
          </div>

          <div className="p2p-modal-summary">
            <div className="p2p-modal-price-row">
              <span className="p2p-listing-category">
                <Tag size={14} />
                {p2pCategoryLabel(listing.category, copy)}
              </span>
              <strong>{formatP2PPrice(listing, lang)}</strong>
            </div>

            <p>{displayListing.description || copy.modal.fallbackDescription}</p>

            <div className="p2p-modal-seller">
              <span
                style={{ backgroundColor: `${seller?.avatarColor || '#00d9ff'}22`, color: seller?.avatarColor || '#00d9ff' }}
              >
                {(seller?.username || 'P2P').slice(0, 2).toUpperCase()}
              </span>
              <div>
                <b>{seller?.username || copy.sellerFallback}</b>
                <small>{copy.modal.listed(listingDateLabel(listing.createdAt, lang, copy))}</small>
              </div>
            </div>

            {isSeller ? (
              <div className="p2p-modal-note">{copy.modal.ownListingNote}</div>
            ) : (
              <div className="p2p-modal-actions">
                <button
                  type="button"
                  className="p2p-primary-action"
                  disabled={isSold || busy}
                  onClick={() => onBuy(listing)}
                >
                  {busy ? <Loader2 size={16} className="p2p-spin" /> : <BadgeDollarSign size={16} />}
                  {copy.actions.buy}
                </button>
                <button
                  type="button"
                  className="p2p-secondary-action"
                  disabled={isSold || busy}
                  onClick={() => onMessageSeller(listing)}
                >
                  {busy ? <Loader2 size={16} className="p2p-spin" /> : <MessageCircle size={16} />}
                  {copy.actions.messageSeller}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p2p-modal-sections">
          <section>
            <h3>
              <ListChecks size={16} />
              {copy.modal.whatsIncluded}
            </h3>
            <div className="p2p-included-list">
              <span>
                <b>{copy.modal.delivery}</b>
                {displayListing.deliveryMethod || copy.modal.sellerHandoff}
              </span>
              <span>
                <b>{copy.modal.files}</b>
                {fileCount ? copy.modal.storedFiles(fileCount) : copy.modal.noUploadedFiles}
              </span>
            </div>

            {fileCount > 0 && (
              <div className="p2p-modal-file-list">
                {listing.files.map((file) => (
                  <span key={`${file.name}-${file.size}-${file.messageId || file.fileUniqueId || ''}`}>
                    <FileArchive size={15} />
                    <b>{file.name}</b>
                    <small>{formatFileSize(file.size, lang)}</small>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3>
              <Tag size={16} />
              {copy.modal.otherProperties}
            </h3>
            <div className="p2p-detail-properties">
              {(displayListing.properties || []).map((property, index) => (
                <span key={`${property.key}-${property.value}-${index}`}>
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

function DeleteListingConfirmModal({ listing, displayListing = listing, copy, busy, onCancel, onConfirm }) {
  const closeOnBackdrop = (event) => {
    if (!busy && event.target === event.currentTarget) onCancel()
  }

  return (
    <motion.div
      className="p2p-confirm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
      onMouseDown={closeOnBackdrop}
    >
      <motion.div
        className="p2p-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="p2p-remove-title"
        aria-describedby="p2p-remove-description"
        initial={{ opacity: 0, y: 34, scale: 0.82, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: CONFIRM_SPRING }}
        exit={{ opacity: 0, y: 22, scale: 0.91, filter: 'blur(10px)', transition: CONFIRM_EXIT_SPRING }}
        style={{ transformOrigin: 'center bottom' }}
      >
        <motion.div
          className="p2p-confirm-icon"
          initial={{ scale: 0.4, rotate: -18 }}
          animate={{ scale: 1, rotate: 0, transition: { ...CONFIRM_SPRING, delay: 0.06 } }}
          aria-hidden="true"
        >
          <Trash2 size={24} />
        </motion.div>

        <div className="p2p-confirm-copy">
          <h2 id="p2p-remove-title">{copy.confirm.title}</h2>
          <p id="p2p-remove-description">{copy.confirm.removeListing(displayListing.title)}</p>
          <span>{copy.confirm.warning}</span>
        </div>

        <div className="p2p-confirm-actions">
          <motion.button
            type="button"
            className="p2p-confirm-cancel"
            onClick={onCancel}
            disabled={busy}
            autoFocus
            whileHover={{ y: -1, scale: 1.015 }}
            whileTap={{ scale: 0.965 }}
          >
            {copy.confirm.cancel}
          </motion.button>
          <motion.button
            type="button"
            className="p2p-confirm-remove"
            onClick={onConfirm}
            disabled={busy}
            whileHover={{ y: -1, scale: 1.015 }}
            whileTap={{ scale: 0.965 }}
          >
            {busy ? <Loader2 size={17} className="p2p-spin" /> : <Trash2 size={17} />}
            {copy.confirm.confirm}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function P2PTradingPage({ onOpenAuth = () => {} }) {
  const {
    accountSettings,
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
  const { t, lang } = useTranslation()
  const copy = t.p2p
  const [activeTab, setActiveTab] = useState('market')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(() => initialListingForm(lang))
  const [properties, setProperties] = useState(() => initialProperties(lang))
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
  const [checkoutListingId, setCheckoutListingId] = useState('')
  const [conversationListingId, setConversationListingId] = useState('')
  const [conversationDraft, setConversationDraft] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [formResetKey, setFormResetKey] = useState(0)

  useEffect(() => {
    clearBackendError()
  }, [clearBackendError])

  useEffect(() => {
    if (!selectedListingId && !checkoutListingId) return undefined

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      if (checkoutListingId) {
        setCheckoutListingId('')
      } else {
        setSelectedListingId('')
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [checkoutListingId, selectedListingId])

  useEffect(() => {
    if (!deleteCandidate) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape' && busyListingId !== deleteCandidate.id) {
        setDeleteCandidate(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [busyListingId, deleteCandidate])

  const listings = state.p2pListings || EMPTY_LISTINGS
  const listingTranslationSource = useMemo(
    () => plainContentTranslationSource(listings, P2P_LISTING_TRANSLATION_OPTIONS),
    [listings],
  )
  const trustTranslationSource = useMemo(
    () => plainContentTranslationSource(P2P_TRUST_COPY, P2P_TRUST_TRANSLATION_OPTIONS),
    [],
  )
  const { data: trustCopy } = useTranslatedIgnContent(P2P_TRUST_COPY, {
    lang,
    scope: 'p2p-trust-copy',
    source: trustTranslationSource,
    translate: translateP2PTrustCopy,
  })
  const { data: displayListings } = useTranslatedIgnContent(listings, {
    lang,
    scope: 'p2p-marketplace-listings',
    source: listingTranslationSource,
    translate: translateP2PListings,
  })
  const displayListingsById = useMemo(() => (
    Object.fromEntries((displayListings || []).map((listing) => [listing.id, listing]))
  ), [displayListings])
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

  const checkoutListing = useMemo(() => {
    return listings.find((listing) => listing.id === checkoutListingId) || null
  }, [checkoutListingId, listings])

  const conversationListing = useMemo(() => {
    return listings.find((listing) => listing.id === conversationListingId) || null
  }, [conversationListingId, listings])
  const displaySelectedListing = selectedListing ? displayListingsById[selectedListing.id] || selectedListing : null
  const displayCheckoutListing = checkoutListing ? displayListingsById[checkoutListing.id] || checkoutListing : null
  const displayConversationListing = conversationListing ? displayListingsById[conversationListing.id] || conversationListing : null
  const displayDeleteCandidate = deleteCandidate ? displayListingsById[deleteCandidate.id] || deleteCandidate : null

  const filteredListings = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase()
    const baseListings = activeTab === 'mine' ? myListings : listings

    return baseListings
      .filter((listing) => {
        const displayListing = displayListingsById[listing.id] || listing
        const seller = usersById[listing.sellerId]
        const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory
        const searchText = [
          listing.title,
          listing.description,
          displayListing.title,
          displayListing.description,
          displayListing.deliveryMethod,
          listing.cryptoWalletAddress,
          p2pCategoryLabel(listing.category, copy),
          p2pPaymentMethodLabel('crypto', copy),
          seller?.username,
          ...(listing.properties || []).flatMap((property) => [property.key, property.value]),
          ...(displayListing.properties || []).flatMap((property) => [property.key, property.value]),
        ].join(' ').toLowerCase()

        return matchesCategory && (!cleanQuery || searchText.includes(cleanQuery))
      })
      .sort((first, second) => {
        if (first.status === 'sold' && second.status !== 'sold') return 1
        if (first.status !== 'sold' && second.status === 'sold') return -1
        return new Date(second.createdAt ?? 0) - new Date(first.createdAt ?? 0)
      })
  }, [activeTab, copy, displayListingsById, listings, myListings, searchQuery, selectedCategory, usersById])

  const updateFormField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const resetForm = () => {
    setForm({
      ...initialListingForm(lang),
      cryptoWalletAddress: accountSettings.defaultTronPayoutAddress || '',
    })
    setProperties(initialProperties(lang))
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
      setFormError(copy.errors.choosePreview)
      return
    }

    try {
      setPreviewDataUrl(await createPreviewDataUrl(file, copy))
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
      setFormError(copy.errors.removeExistingFile)
      event.target.value = ''
      return
    }

    const attachedFileKeys = new Set(listingFiles.map(fileSelectionKey))
    const newFiles = selectedFiles.filter((file) => !attachedFileKeys.has(fileSelectionKey(file)))

    if (!newFiles.length) {
      setFormError(copy.errors.duplicateFiles)
      event.target.value = ''
      return
    }

    if (newFiles.length > availableSlots) {
      setFormError(copy.errors.attachUpTo(availableSlots))
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
      price: fixedPriceInput(listing.price),
      cryptoWalletAddress: listing.cryptoWalletAddress || '',
      deliveryMethod: listing.deliveryMethod || '',
      description: listing.description || '',
    })
    setProperties(listing.properties?.length ? listing.properties : initialProperties(lang))
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
    const cryptoWalletAddress = form.cryptoWalletAddress.trim()

    if (title.length < 3) {
      setFormError(copy.errors.minTitle)
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError(copy.errors.validPrice)
      return
    }

    if (!nextProperties.length) {
      setFormError(copy.errors.oneProperty)
      return
    }

    if (!TRON_ADDRESS_PATTERN.test(cryptoWalletAddress)) {
      setFormError(copy.errors.validWallet)
      return
    }

    if (totalFileCount > MAX_LISTING_FILES) {
      setFormError(copy.errors.maxFiles(MAX_LISTING_FILES))
      return
    }

    if (
      accountSettings.confirmWalletBeforeListing
      && !window.confirm(`Confirm seller payout address:\n\n${cryptoWalletAddress}\n\nUSDT payouts for this listing will be sent to this address.`)
    ) {
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
            setUploadProgress(copy.notices.uploading({ file, index, total, name: file.name }))
          },
        )
      }

      const payload = {
        title,
        description: form.description,
        category: form.category,
        price,
        currency: 'USDT',
        cryptoWalletAddress,
        deliveryMethod: form.deliveryMethod,
        paymentMethods: ['crypto'],
        properties: nextProperties,
        previewDataUrl,
        files: [...existingFiles, ...uploadedFiles],
      }

      const saved = isEditing
        ? await updateP2PListing(editingListingId, payload)
        : await createP2PListing(payload)

      if (!saved) {
        throw new Error(isEditing ? copy.errors.updateFailed : copy.errors.publishFailed)
      }

      setFormOpen(false)
      setActiveTab('mine')
      setFormSuccess(isEditing ? copy.notices.updated : copy.notices.published)
    } catch (error) {
      setFormError(error.message || (isEditing ? copy.errors.updateFailed : copy.errors.publishFailed))
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  const handleMessageSeller = (listing, paymentTxId = '', payoutTxId = '') => {
    setActionNotice('')

    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    if (currentProfileId === listing.sellerId) return

    setConversationDraft(paymentTxId ? copy.messages.proof({ title: listing.title, paymentTxId, payoutTxId }) : '')
    setSelectedListingId('')
    setCheckoutListingId('')
    setConversationListingId(listing.id)
  }

  const handleMarkSold = async (listing) => {
    setActionNotice('')
    setBusyListingId(listing.id)
    const updated = await updateP2PListingStatus(listing.id, 'sold')
    setBusyListingId('')
    setActionNotice(updated ? copy.notices.markedSold : copy.errors.updateFailed)
  }

  const handleToggleListingStatus = async (listing) => {
    const nextStatus = listing.status === 'sold' ? 'active' : 'sold'
    setActionNotice('')
    setBusyListingId(listing.id)
    const updated = await updateP2PListingStatus(listing.id, nextStatus)
    setBusyListingId('')
    setActionNotice(updated ? copy.notices.statusUpdated(copy.status[nextStatus]) : copy.errors.updateFailed)
  }

  const handleDeleteListing = (listing) => {
    setActionNotice('')
    setDeleteCandidate(listing)
  }

  const handleConfirmDeleteListing = async () => {
    if (!deleteCandidate) return

    const listing = deleteCandidate
    setBusyListingId(listing.id)

    try {
      const deleted = await deleteP2PListing(listing.id)
      setActionNotice(deleted ? copy.notices.removed : copy.errors.removeFailed)

      if (deleted && editingListingId === listing.id) {
        closeForm()
      }
    } catch {
      setActionNotice(copy.errors.removeFailed)
    } finally {
      setBusyListingId('')
      setDeleteCandidate(null)
    }
  }

  const handleViewListingDetails = (listing) => {
    if (activeTab !== 'market') return
    setSelectedListingId(listing.id)
  }

  const handleBuyListing = (listing) => {
    if (activeTab !== 'market' || listing.status === 'sold') return
    setSelectedListingId('')
    setCheckoutListingId(listing.id)
  }

  return (
    <section className="p2p-page section-padding">
      <div className="container p2p-container">
        <header className="p2p-hero">
          <div className="p2p-hero-copy">
            <span className="p2p-kicker">
              <Handshake size={16} />
              {copy.hero.kicker}
            </span>
            <h1>{copy.hero.title}</h1>
            <p>{copy.hero.description}</p>
          </div>

          <div className="p2p-hero-panel" aria-label={copy.hero.summaryLabel}>
            <div>
              <strong>{activeListingCount}</strong>
              <span>{copy.hero.activeListings}</span>
            </div>
            <div>
              <strong>{totalStoredFiles}</strong>
              <span>{copy.hero.storedFiles}</span>
            </div>
            <div>
              <strong>{P2P_CATEGORIES.length}</strong>
              <span>{copy.hero.tradeLanes}</span>
            </div>
          </div>
        </header>

        <section className="p2p-trust-panel" aria-labelledby="p2p-trust-title">
          <div className="p2p-trust-heading">
            <span className="p2p-kicker">
              <ShieldCheck size={16} />
              {trustCopy.kicker}
            </span>
            <h2 id="p2p-trust-title">{trustCopy.title}</h2>
            <p>{trustCopy.description}</p>
            <ul className="p2p-protection-list" aria-label={trustCopy.listLabel}>
              {trustCopy.points.map((point) => (
                <li key={point}>
                  <ShieldCheck size={15} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p2p-trust-grid">
            {trustCopy.sections.map((section) => (
              <article key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="p2p-view-tabs" aria-label={copy.tabs.label}>
          <button
            type="button"
            className={activeTab === 'market' ? 'active' : ''}
            onClick={() => setActiveTab('market')}
          >
            <Handshake size={16} />
            {copy.tabs.marketplace}
          </button>
          <button
            type="button"
            className={activeTab === 'mine' ? 'active' : ''}
            onClick={handleMyProductsTab}
          >
            <Store size={16} />
            {copy.tabs.myProducts}
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
              placeholder={copy.toolbar.searchPlaceholder}
            />
          </label>

          <div className="p2p-category-tabs" aria-label={copy.toolbar.categoriesLabel}>
            <button
              type="button"
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              {copy.toolbar.all}
            </button>
            {P2P_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
              >
                {p2pCategoryLabel(category.id, copy)}
              </button>
            ))}
          </div>

          <button type="button" className="p2p-create-toggle" onClick={handleOpenForm} disabled={authLoading}>
            <PackagePlus size={17} />
            {formOpen && !isEditing ? copy.toolbar.closeForm : isSignedIn ? copy.toolbar.createListing : copy.toolbar.signInToSell}
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
                  {isEditing ? copy.form.editKicker : copy.form.newKicker}
                </span>
                <h2>{isEditing ? copy.form.editTitle : copy.form.createTitle}</h2>
              </div>
              <button type="button" onClick={closeForm} aria-label={copy.form.closeLabel}>
                <X size={18} />
              </button>
            </div>

            <div className="p2p-form-grid">
              <label>
                <span>{copy.form.title}</span>
                <input
                  value={form.title}
                  onChange={(event) => updateFormField('title', event.target.value)}
                  placeholder={copy.form.titlePlaceholder}
                  maxLength="90"
                />
              </label>

              <label>
                <span>{copy.form.category}</span>
                <select value={form.category} onChange={(event) => updateFormField('category', event.target.value)}>
                  {P2P_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{p2pCategoryLabel(category.id, copy)}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>{copy.form.price}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => updateFormField('price', sanitizePriceInput(event.target.value))}
                  onBlur={() => updateFormField('price', fixedPriceInput(form.price))}
                  placeholder="0.00"
                />
              </label>

              <label>
                <span>{copy.form.wallet}</span>
                <input
                  value={form.cryptoWalletAddress}
                  onChange={(event) => updateFormField('cryptoWalletAddress', event.target.value)}
                  placeholder={copy.form.walletPlaceholder}
                  maxLength="128"
                />
              </label>

              <label className="p2p-form-wide">
                <span>{copy.form.delivery}</span>
                <input
                  value={form.deliveryMethod}
                  onChange={(event) => updateFormField('deliveryMethod', event.target.value)}
                  placeholder={copy.form.deliveryPlaceholder}
                  maxLength="80"
                />
              </label>

              <label className="p2p-form-wide">
                <span>{copy.form.description}</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  placeholder={copy.form.descriptionPlaceholder}
                  maxLength="520"
                />
              </label>
            </div>

            <div className="p2p-properties-editor">
              <div className="p2p-subhead">
                <h3>{copy.form.properties}</h3>
                <button type="button" onClick={addProperty}>
                  <Plus size={15} />
                  {copy.form.add}
                </button>
              </div>
              {properties.map((property, index) => (
                <div className="p2p-property-row" key={`property-${index}`}>
                  <input
                    value={property.key}
                    onChange={(event) => updateProperty(index, 'key', event.target.value)}
                    placeholder={copy.form.propertyPlaceholder}
                    maxLength="30"
                  />
                  <input
                    value={property.value}
                    onChange={(event) => updateProperty(index, 'value', event.target.value)}
                    placeholder={copy.form.valuePlaceholder}
                    maxLength="64"
                  />
                  <button type="button" onClick={() => removeProperty(index)} aria-label={copy.form.removeProperty}>
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p2p-upload-grid">
              <div>
                <label className="p2p-upload-box">
                  <ImagePlus size={22} />
                  <span>{copy.form.previewImage}</span>
                  <small>{previewFile ? previewFile.name : copy.form.imageTypes}</small>
                  <input key={`preview-${formResetKey}`} type="file" accept="image/*" onChange={handlePreviewChange} />
                </label>
                {previewDataUrl && (
                  <img className="p2p-preview-thumb" src={previewDataUrl} alt={copy.form.listingPreviewAlt} decoding="async" />
                )}
              </div>

              <div>
                <label className="p2p-upload-box">
                  <UploadCloud size={22} />
                  <span>{copy.form.saleFiles}</span>
                  <small>
                    {listingFiles.length
                      ? copy.form.selected(listingFiles.length)
                      : isEditing
                        ? copy.form.slotsAvailable(Math.max(0, MAX_LISTING_FILES - existingFiles.length))
                        : copy.form.fileTypes}
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
                  <div className="p2p-existing-files" aria-label={copy.form.storedFilesLabel}>
                    {existingFiles.map((file, index) => (
                      <div className="p2p-existing-file" key={`${file.name}-${file.size}-${index}`}>
                        <span>
                          {file.name}
                          <small>{formatFileSize(file.size, lang)}</small>
                        </span>
                        <button type="button" onClick={() => removeExistingFile(index)} aria-label={copy.form.removeFile(file.name)}>
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
                          <small>{formatFileSize(file.size, lang)}</small>
                        </span>
                        <button type="button" onClick={() => removeListingFile(index)} aria-label={copy.form.removeFile(file.name)}>
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
                {copy.form.footerNote}
              </span>
              <button type="submit" className="p2p-primary-action" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="p2p-spin" /> : <Check size={16} />}
                {submitting
                  ? uploadProgress || (isEditing ? copy.form.saving : copy.form.publishing)
                  : isEditing ? copy.form.saveChanges : copy.form.publishListing}
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
              displayListing={displayListingsById[listing.id] || listing}
              seller={usersById[listing.sellerId]}
              currentUserId={currentProfileId}
              copy={copy}
              lang={lang}
              busy={busyListingId === listing.id}
              management={activeTab === 'mine'}
              onEdit={handleEditListing}
              onDelete={handleDeleteListing}
              onBuy={handleBuyListing}
              onViewDetails={handleViewListingDetails}
              onMarkSold={handleMarkSold}
              onToggleStatus={handleToggleListingStatus}
            />
          ))}
        </div>

        {!filteredListings.length && (
          <div className="p2p-empty">
            <FileArchive size={28} />
            <strong>{activeTab === 'mine' ? copy.empty.noProducts : copy.empty.noListings}</strong>
            <span>
              {activeTab === 'mine'
                ? copy.empty.createFirst
                : copy.empty.tryAnother}
            </span>
          </div>
        )}

        {selectedListing && (
          <P2PProductDetailsModal
            listing={selectedListing}
            displayListing={displaySelectedListing}
            seller={usersById[selectedListing.sellerId]}
            currentUserId={currentProfileId}
            copy={copy}
            lang={lang}
            busy={busyListingId === selectedListing.id}
            onClose={() => setSelectedListingId('')}
            onBuy={handleBuyListing}
            onMessageSeller={handleMessageSeller}
          />
        )}

        {checkoutListing && (
          <P2PCheckoutModal
            key={checkoutListing.id}
            listing={checkoutListing}
            displayListing={displayCheckoutListing}
            isSignedIn={isSignedIn}
            copy={copy}
            onClose={() => setCheckoutListingId('')}
            onRequireAuth={onOpenAuth}
            onMessageSeller={handleMessageSeller}
          />
        )}

        {conversationListing && (
          <MessageConversationModal
            key={`${conversationListing.id}:${conversationDraft}`}
            recipient={usersById[conversationListing.sellerId]}
            contextLabel={displayConversationListing.title}
            initialBody={conversationDraft}
            hiddenBodies={legacyP2PMessageBodies(conversationListing)}
            onClose={() => {
              setConversationListingId('')
              setConversationDraft('')
            }}
          />
        )}

        <AnimatePresence>
          {deleteCandidate && (
            <DeleteListingConfirmModal
              key={deleteCandidate.id}
              listing={deleteCandidate}
              displayListing={displayDeleteCandidate}
              copy={copy}
              busy={busyListingId === deleteCandidate.id}
              onCancel={() => setDeleteCandidate(null)}
              onConfirm={handleConfirmDeleteListing}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default P2PTradingPage
