export const PAYMENT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
export const PAYMENT_NETWORK = 'USDT TRC20'

const overlayImageModules = import.meta.glob('../assets/shop/Stream overlays/*.png', {
  eager: true,
  import: 'default',
})

const overlayNames = [
  'Vice Nights Broadcast Kit',
  'Ocean Drive Stream Suite',
  'Neon Storm Overlay Bundle',
  'Leonida Heat Scene Pack',
  'Downtown Chase Creator Pack',
  'Keys Sunset Stream Kit',
  'Port Gellhorn Night Set',
  'Paradise Hotel Overlay Pack',
]

const overlayTags = [
  ['Animated-ready', 'Facecam', 'Alerts'],
  ['Starting soon', 'Social lower third', 'Donation panel'],
  ['BRB scene', 'Subscriber panel', 'Purple neon'],
  ['Gameplay frame', 'Chat panel', 'Cyan HUD'],
  ['Racing theme', 'Goal bar', 'Creator badges'],
  ['Beach scene', 'Follower alert', 'Turquoise trim'],
  ['Night city', 'Motel frame', 'High contrast'],
  ['Vice City', 'Pink trim', 'Full stream set'],
]

export const categoryTabs = [
  { id: 'stream-overlays', label: 'Stream overlays', count: Object.keys(overlayImageModules).length, active: true },
  { id: 'profile-banners', label: 'Profile banners', count: 0 },
  { id: 'emote-packs', label: 'Emote packs', count: 0 },
  { id: 'logo-kits', label: 'Logo kits', count: 0 },
]

export const STREAM_OVERLAY_PRODUCTS = Object.entries(overlayImageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([path, image], index) => ({
    id: path.split('/').pop()?.replace('.png', '').toLowerCase() || `overlay-${index + 1}`,
    title: overlayNames[index] || `Leonida Stream Overlay ${index + 1}`,
    image,
    price: 12 + (index % 4) * 3,
    format: 'PNG pack',
    resolution: '1672 x 941',
    tags: overlayTags[index] || ['Stream overlay', 'Creator asset', 'Leonida style'],
  }))
