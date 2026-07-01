import emotePackPreview from '../assets/shop/Emote pack sheet previews/gta_vi_emote_pack_03.webp'
import overlayPreview from '../assets/shop/Stream overlay previews/20.webp'
import bannerPreview from '../assets/shop/Profile banner previews/B7A7EEDD-4A0B-43A9-9D41-893635EA6D91.webp'

export const P2P_CATEGORIES = [
  { id: 'digital-assets', label: 'Digital assets' },
  { id: 'streaming', label: 'Streaming kits' },
  { id: 'guides', label: 'Guides' },
  { id: 'services', label: 'Services' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'other', label: 'Other' },
]

export const P2P_CURRENCIES = ['USDT']

export const P2P_PAYMENT_METHODS = [
  { id: 'crypto', label: 'Crypto', detail: 'USDT on TRON/TRC20' },
]

export const P2P_SEED_LISTINGS = [
  {
    id: 'p2p-vice-overlay-pack',
    sellerId: 'user-trailerwatch',
    title: 'Vice City stream overlay source pack',
    description: 'Animated scene panels, webcam frames, alerts, and editable source files for GTA VI streams.',
    category: 'streaming',
    price: 18,
    currency: 'USDT',
    deliveryMethod: 'Instant file handoff',
    paymentMethods: ['crypto'],
    previewDataUrl: overlayPreview,
    properties: [
      { key: 'Format', value: 'PNG, MOV, PSD' },
      { key: 'Resolution', value: '1920x1080' },
      { key: 'License', value: 'Personal streams' },
    ],
    files: [
      {
        name: 'vice-city-overlay-source.zip',
        size: 184000000,
        type: 'application/zip',
        provider: 'telegram_bot',
        storageStatus: 'sample',
      },
    ],
    status: 'active',
    createdAt: '2026-05-22T12:15:00.000Z',
    updatedAt: '2026-05-22T12:15:00.000Z',
  },
  {
    id: 'p2p-emote-license',
    sellerId: 'user-vice-archivist',
    title: 'GTA VI reaction emote pack license',
    description: 'A ready-to-use reaction set for Discord servers, Twitch panels, and fan community posts.',
    category: 'digital-assets',
    price: 12,
    currency: 'USDT',
    deliveryMethod: 'Seller delivery after payment',
    paymentMethods: ['crypto'],
    previewDataUrl: emotePackPreview,
    properties: [
      { key: 'Files', value: '10 transparent WebP' },
      { key: 'Use', value: 'Community channels' },
      { key: 'Rights', value: 'Non-exclusive' },
    ],
    files: [
      {
        name: 'reaction-emotes-webp.zip',
        size: 26800000,
        type: 'application/zip',
        provider: 'telegram_bot',
        storageStatus: 'sample',
      },
    ],
    status: 'active',
    createdAt: '2026-05-20T16:38:00.000Z',
    updatedAt: '2026-05-20T16:38:00.000Z',
  },
  {
    id: 'p2p-leonida-banner-set',
    sellerId: 'user-maprunner',
    title: 'Leonida profile banner set',
    description: 'Thirty-two social profile banners with neon, beach, highway, and nightclub variants.',
    category: 'digital-assets',
    price: 9,
    currency: 'USDT',
    deliveryMethod: 'Telegram file bundle',
    paymentMethods: ['crypto'],
    previewDataUrl: bannerPreview,
    properties: [
      { key: 'Count', value: '32 banners' },
      { key: 'Ratio', value: '16:9 and 3:1' },
      { key: 'Edits', value: 'Color-safe PSD' },
    ],
    files: [
      {
        name: 'leonida-profile-banners.zip',
        size: 73000000,
        type: 'application/zip',
        provider: 'telegram_bot',
        storageStatus: 'sample',
      },
    ],
    status: 'active',
    createdAt: '2026-05-18T10:05:00.000Z',
    updatedAt: '2026-05-18T10:05:00.000Z',
  },
]

export function p2pCategoryLabel(categoryId, copy = {}) {
  return copy.categories?.[categoryId] || P2P_CATEGORIES.find((category) => category.id === categoryId)?.label || copy.otherCategory || 'Other'
}

export function p2pPaymentMethodLabel(methodId, copy = {}) {
  return copy.paymentMethods?.[methodId]?.label || P2P_PAYMENT_METHODS.find((method) => method.id === methodId)?.label || methodId
}

export function p2pPaymentMethodDetail(methodId, copy = {}) {
  return copy.paymentMethods?.[methodId]?.detail || P2P_PAYMENT_METHODS.find((method) => method.id === methodId)?.detail || ''
}

export function formatP2PPrice(listing, lang = 'en') {
  const amount = Number(listing.price)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const formattedAmount = new Intl.NumberFormat(lang || 'en', {
    minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)

  return `${formattedAmount} USDT`
}

export function formatFileSize(bytes = 0, lang = 'en') {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size <= 0) return '0 KB'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / (1024 ** exponent)
  const formattedValue = new Intl.NumberFormat(lang || 'en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 10 || exponent === 0 ? 0 : 1,
  }).format(value)

  return `${formattedValue} ${units[exponent]}`
}
