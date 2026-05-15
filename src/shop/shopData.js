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

const profileBannerImageModules = {
  ...import.meta.glob('../assets/shop/Profile banners/*.png', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../assets/shop/Profile banners/*.PNG', {
    eager: true,
    import: 'default',
  }),
}

const emotePackImageModules = {
  ...import.meta.glob('../assets/shop/Emote packs/*/*.png', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../assets/shop/Emote packs/*/*.PNG', {
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

const profileBannerNames = [
  'Vice Skyline Profile Banner',
  'Leonida Nightlife Banner',
  'Port Gellhorn Banner',
  'Ocean Drive Social Header',
  'Downtown Vice Banner',
  'Keys Sunset Profile Header',
  'Grassrivers Profile Banner',
  'Vice Beach Social Banner',
  'Neon Motel Header',
  'Ambrosia Profile Banner',
  'Sahara Arena Social Header',
  'Leonida Coast Banner',
  'Vice City Creator Header',
  'Palm Coast Profile Banner',
  'Vice Nights Social Header',
]

const profileBannerTags = [
  ['Profile header', 'Creator page', 'Wide format'],
  ['Social banner', 'Neon grade', 'Fan profile'],
  ['Community header', 'Leonida style', 'PNG asset'],
  ['Hero banner', 'Cover image', 'High impact'],
  ['Profile art', 'Cinematic crop', 'Ready to upload'],
]

const profileBannerStandardStems = new Set([
  '187E7061-ABAE-42C5-B451-D3D44FFA74F3',
  '24C2F4DA-EEA8-4A0E-AEE0-B5CE70E8B8DA',
  '27FF00B9-8899-4880-B937-3E22D93CBA84',
  '3B8210F2-85D5-4CB4-AC5B-5E70C8D921E0',
  '452BAB35-D9CC-4512-8133-5B19F6544977',
  '4A84227E-728E-4910-8DDA-C72E2B38EB03',
  '5C9F78B2-0BEC-4A88-AEB8-04DFE0A10271',
  '60BC3A78-1EB0-4784-89D1-5DE090584F4F',
  'A2FF8B11-C8FB-494A-9919-B1A51888B9F0',
  'CFAF8C74-53F3-4008-966B-1F5C09995244',
])

const emotePackMeta = {
  gta_vi_emote_pack_01: {
    title: 'Vice Hustle Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Chat reactions', 'Vice City style'],
  },
  gta_vi_emote_pack_02: {
    title: 'Leonida Heat Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Creator chat', 'Neon reactions'],
  },
  gta_vi_emote_pack_03: {
    title: 'Keys Flex Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Streamer-ready', 'Transparent PNG'],
  },
}

function overlayFileStem(path) {
  return path.split('/').pop()?.replace(/\.png$/i, '') || ''
}

function emotePackFolder(path) {
  const segments = path.split('/')
  return segments[segments.length - 2] || ''
}

function sortedImageEntries(modules) {
  return Object.entries(modules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' }))
}

function sortedEmotePacks() {
  const packs = new Map()

  sortedImageEntries(emotePackImageModules).forEach(([path, image]) => {
    const folder = emotePackFolder(path)
    if (!folder) return

    const pack = packs.get(folder) || { folder, images: [] }
    pack.images.push(image)
    packs.set(folder, pack)
  })

  return Array.from(packs.values())
    .sort((packA, packB) => packA.folder.localeCompare(packB.folder, undefined, { numeric: true, sensitivity: 'base' }))
}

function profileBannerResolution(stem) {
  return profileBannerStandardStems.has(stem) ? '1983 x 793' : '1916 x 821'
}

function profileBannerAspectRatio(stem) {
  return profileBannerStandardStems.has(stem) ? '1983 / 793' : '1916 / 821'
}

export const STREAM_OVERLAY_PRODUCTS = sortedImageEntries(overlayImageModules)
  .map(([path, image], index) => {
    const stem = overlayFileStem(path)

    return {
      id: stem ? `stream-${stem.toLowerCase()}` : `stream-overlay-${index + 1}`,
      categoryId: 'stream-overlays',
      categoryLabel: 'Stream overlays',
      previewLabel: 'Stream overlay preview',
      title: overlayNames[index] || `Leonida Stream Overlay ${index + 1}`,
      image,
      price: 12 + (index % 4) * 3,
      format: 'PNG pack',
      resolution: stem.startsWith('IMG_') ? '1376 x 768' : '1672 x 941',
      aspectRatio: stem.startsWith('IMG_') ? '1376 / 768' : '1672 / 941',
      tags: overlayTags[index] || fallbackOverlayTags[index % fallbackOverlayTags.length],
    }
  })

export const PROFILE_BANNER_PRODUCTS = sortedImageEntries(profileBannerImageModules)
  .map(([path, image], index) => {
    const stem = overlayFileStem(path)

    return {
      id: stem ? `banner-${stem.toLowerCase()}` : `profile-banner-${index + 1}`,
      categoryId: 'profile-banners',
      categoryLabel: 'Profile banners',
      previewLabel: 'Profile banner preview',
      title: profileBannerNames[index] || `Leonida Profile Banner ${index + 1}`,
      image,
      price: 8 + (index % 3) * 2,
      format: 'Profile banner PNG',
      resolution: profileBannerResolution(stem),
      aspectRatio: profileBannerAspectRatio(stem),
      tags: profileBannerTags[index % profileBannerTags.length],
    }
  })

export const EMOTE_PACK_PRODUCTS = sortedEmotePacks()
  .map((pack, index) => {
    const meta = emotePackMeta[pack.folder] || {}

    return {
      id: `emotes-${pack.folder.replace(/_/g, '-')}`,
      categoryId: 'emote-packs',
      categoryLabel: 'Emote packs',
      previewLabel: 'Emote pack preview',
      title: meta.title || `Leonida Emote Pack ${index + 1}`,
      image: pack.images[0],
      images: pack.images,
      price: meta.price || 16,
      format: `${pack.images.length} emote PNGs`,
      resolution: '1024 x 1024 each',
      aspectRatio: '16 / 9',
      tags: meta.tags || ['Emote pack', 'Streamer-ready', 'Transparent PNG'],
    }
  })

export const SHOP_PRODUCTS_BY_CATEGORY = {
  'stream-overlays': STREAM_OVERLAY_PRODUCTS,
  'profile-banners': PROFILE_BANNER_PRODUCTS,
  'emote-packs': EMOTE_PACK_PRODUCTS,
}

export const categoryTabs = [
  { id: 'stream-overlays', label: 'Stream overlays', count: STREAM_OVERLAY_PRODUCTS.length, active: true },
  { id: 'profile-banners', label: 'Profile banners', count: PROFILE_BANNER_PRODUCTS.length, active: true },
  { id: 'emote-packs', label: 'Emote packs', count: EMOTE_PACK_PRODUCTS.length, active: true },
  { id: 'logo-kits', label: 'Logo kits', count: 0 },
]
