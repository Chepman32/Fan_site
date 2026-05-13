export const PAYMENT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
export const PAYMENT_NETWORK = 'USDT TRC20'
export const TRONGRID_FULL_HOST = 'https://api.trongrid.io'
export const USDT_CONTRACT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'
export const USDT_DECIMALS = 6
export const USDT_TRANSFER_FEE_LIMIT = 100_000_000

const overlayImageModules = {
  ...import.meta.glob('../assets/shop/Stream overlays/*.png', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../assets/shop/Stream overlays/*.PNG', {
    eager: true,
    import: 'default',
  }),
}

const overlayNames = [
  'Vice Nights Broadcast Kit',
  'Ocean Drive Stream Suite',
  'Neon Storm Overlay Bundle',
  'Leonida Heat Scene Pack',
  'Downtown Chase Creator Pack',
  'Keys Sunset Stream Kit',
  'Port Gellhorn Night Set',
  'Paradise Hotel Overlay Pack',
  'Blue Line Stream Pack',
  'Get Ready Overlay Suite',
  'Coastal Stunt Broadcast Kit',
  'Grassrivers Creator Frame',
  'Downtown Start Screen',
  'Lifeguard Stream Kit',
  'Beachside Countdown Set',
  'Port Vice City Overlay',
  'Starlight Strip Broadcast Kit',
  'Six Star Chase Pack',
  'Driveway Stream Scene',
  'Bay City Overlay Kit',
  'Backroad Creator Pack',
  'Club Neon Stream Set',
  'Ocean View Intermission Kit',
  'Airstrip Chase Overlay',
  'Palm Island Broadcast Kit',
  'Glades Trail Stream Set',
  'Highway Heat Creator Pack',
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

const fallbackOverlayTags = [
  ['Stream overlay', 'Creator asset', 'Leonida style'],
  ['Starting soon', 'Countdown', 'Broadcast-ready'],
  ['Gameplay frame', 'Facecam', 'Chat panel'],
  ['Intermission', 'Social panel', 'Neon trim'],
  ['Alerts', 'Lower third', 'Creator badges'],
  ['Race scene', 'Goal bar', 'High contrast'],
]

function overlayFileStem(path) {
  return path.split('/').pop()?.replace(/\.png$/i, '') || ''
}

export const categoryTabs = [
  { id: 'stream-overlays', label: 'Stream overlays', count: Object.keys(overlayImageModules).length, active: true },
  { id: 'profile-banners', label: 'Profile banners', count: 0 },
  { id: 'emote-packs', label: 'Emote packs', count: 0 },
  { id: 'logo-kits', label: 'Logo kits', count: 0 },
]

export const STREAM_OVERLAY_PRODUCTS = Object.entries(overlayImageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([path, image], index) => {
    const stem = overlayFileStem(path)

    return {
      id: stem.toLowerCase() || `overlay-${index + 1}`,
      title: overlayNames[index] || `Leonida Stream Overlay ${index + 1}`,
      image,
      price: 12 + (index % 4) * 3,
      format: 'PNG pack',
      resolution: stem.startsWith('IMG_') ? '1376 x 768' : '1672 x 941',
      tags: overlayTags[index] || fallbackOverlayTags[index % fallbackOverlayTags.length],
    }
  })
