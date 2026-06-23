import { LOCATION_GUIDES, getLocationGuideBySlug } from '../data/ignWiki'

export const SITE_ORIGIN = 'https://leonidaloot.com'
export const SITE_NAME = 'Leonida Loot'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`
export const DEFAULT_IMAGE_ALT = 'Leonida Loot GTA VI fan hub preview'

const DEFAULT_DESCRIPTION = 'Leonida Loot is a GTA VI fan hub with Vice City and Leonida guides, news, media, community posts, creator shop assets, and a P2P digital marketplace.'
const HOME_SECTIONS = [
  { name: 'GTA VI game info', url: `${SITE_ORIGIN}/#game-info` },
  { name: 'Characters', url: `${SITE_ORIGIN}/#characters` },
  { name: 'Weapons guide', url: `${SITE_ORIGIN}/#weapons` },
  { name: 'Vehicles guide', url: `${SITE_ORIGIN}/#vehicles` },
  { name: 'Leonida locations', url: `${SITE_ORIGIN}/#leonida` },
  { name: 'News', url: `${SITE_ORIGIN}/#news` },
]
const SHOP_CATEGORIES = [
  'GTA VI stream overlays',
  'Leonida profile banners',
  'GTA VI emote packs',
]

function absoluteUrl(path = '/') {
  return new URL(path, SITE_ORIGIN).toString()
}

export function canonicalPath(route) {
  if (!route || route === '/') return '/'
  return route.endsWith('/') ? route.slice(0, -1) : route
}

function cleanDescription(value, fallback = DEFAULT_DESCRIPTION) {
  const clean = String(value || fallback).replace(/\s+/g, ' ').trim()
  if (clean.length <= 158) return clean
  return `${clean.slice(0, 155).replace(/\s+\S*$/, '')}...`
}

function breadcrumb(pathItems) {
  return [
    { name: SITE_NAME, url: absoluteUrl('/') },
    ...pathItems,
  ]
}

function pageMetadata({
  route,
  title,
  description,
  breadcrumbs = [],
  robots = 'index,follow',
  type = 'website',
  schemaType = 'WebPage',
  image = DEFAULT_OG_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  extraJsonLd = [],
}) {
  const canonicalUrl = absoluteUrl(canonicalPath(route))
  const safeDescription = cleanDescription(description)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

  return {
    title: fullTitle,
    description: safeDescription,
    canonicalUrl,
    robots,
    type,
    schemaType,
    image,
    imageAlt,
    breadcrumbs: breadcrumb(breadcrumbs),
    extraJsonLd,
  }
}

function homeMetadata() {
  return pageMetadata({
    route: '/',
    title: 'Leonida Loot | GTA VI Fan Hub, Guides, News & Creator Assets',
    description: DEFAULT_DESCRIPTION,
    schemaType: 'WebPage',
    extraJsonLd: [
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/#home-sections`,
        name: 'Leonida Loot GTA VI guide sections',
        itemListElement: HOME_SECTIONS.map((section, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: section.name,
          url: section.url,
        })),
      },
    ],
  })
}

function communityMetadata() {
  return pageMetadata({
    route: '/community',
    title: 'GTA VI Community Feed',
    description: 'Join Leonida Loot community posts, rumors, source tracking, polls, reactions, and GTA VI fan discussion.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Community', url: absoluteUrl('/community') }],
  })
}

function shopMetadata() {
  return pageMetadata({
    route: '/shop',
    title: 'GTA VI Creator Shop',
    description: 'Browse Leonida Loot creator assets including GTA VI stream overlays, profile banners, and emote packs with USDT TRC20 checkout.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Shop', url: absoluteUrl('/shop') }],
    extraJsonLd: [
      {
        '@type': 'OfferCatalog',
        '@id': `${SITE_ORIGIN}/shop#catalog`,
        name: 'Leonida Loot creator asset catalog',
        itemListElement: SHOP_CATEGORIES.map((name, index) => ({
          '@type': 'OfferCatalog',
          position: index + 1,
          name,
        })),
      },
      {
        '@type': 'Store',
        '@id': `${SITE_ORIGIN}/shop#store`,
        name: `${SITE_NAME} Creator Shop`,
        url: absoluteUrl('/shop'),
        image: DEFAULT_OG_IMAGE,
        paymentAccepted: 'USDT TRC20',
      },
    ],
  })
}

function p2pMetadata() {
  return pageMetadata({
    route: '/p2p',
    title: 'P2P Digital Marketplace',
    description: 'Trade GTA VI fan assets, stream kits, guides, services, and digital goods through the Leonida Loot P2P marketplace.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'P2P Marketplace', url: absoluteUrl('/p2p') }],
    extraJsonLd: [
      {
        '@type': 'Service',
        '@id': `${SITE_ORIGIN}/p2p#marketplace-service`,
        name: 'Leonida Loot P2P digital marketplace',
        serviceType: 'Digital goods marketplace',
        provider: { '@id': `${SITE_ORIGIN}/#organization` },
        areaServed: 'Worldwide',
      },
    ],
  })
}

function ownProfileMetadata(currentProfile) {
  const profileName = currentProfile?.username ? `${currentProfile.username}'s profile` : 'Your profile'

  return pageMetadata({
    route: '/profile',
    title: profileName,
    description: 'Manage your Leonida Loot GTA VI community profile, posts, bookmarks, purchases, badges, and saved sources.',
    robots: 'noindex,follow',
    breadcrumbs: [{ name: 'Profile', url: absoluteUrl('/profile') }],
  })
}

function publicProfileMetadata(route, state) {
  const userId = route.slice('/profile/'.length)
  const profile = state.users.find((user) => user.id === userId)
  const username = profile?.username || 'Community profile'
  const bio = profile?.bio ? ` ${profile.bio}` : ''

  return pageMetadata({
    route,
    title: `${username} Community Profile`,
    description: `${username} on Leonida Loot: GTA VI posts, source submissions, badges, and community activity.${bio}`,
    schemaType: 'ProfilePage',
    breadcrumbs: [
      { name: 'Community', url: absoluteUrl('/community') },
      { name: username, url: absoluteUrl(route) },
    ],
    extraJsonLd: profile ? [
      {
        '@type': 'Person',
        '@id': `${absoluteUrl(route)}#person`,
        name: username,
        description: cleanDescription(profile.bio, `${username} Leonida Loot community profile.`),
        url: absoluteUrl(route),
      },
    ] : [],
  })
}

function messagesMetadata() {
  return pageMetadata({
    route: '/messages',
    title: 'Messages',
    description: 'Private Leonida Loot direct messages for P2P buyers, sellers, and signed-in community members.',
    robots: 'noindex,nofollow',
    breadcrumbs: [{ name: 'Messages', url: absoluteUrl('/messages') }],
  })
}

function locationMetadata(route) {
  const slug = route.slice('/locations/'.length)
  const guide = getLocationGuideBySlug(slug)

  if (!guide) {
    return pageMetadata({
      route,
      title: 'Leonida Location Not Found',
      description: 'This Leonida location guide was not found. Browse the available GTA VI Leonida location pages on Leonida Loot.',
      robots: 'noindex,follow',
      breadcrumbs: [
        { name: 'Leonida Locations', url: `${SITE_ORIGIN}/#leonida` },
        { name: 'Location not found', url: absoluteUrl(route) },
      ],
    })
  }

  return pageMetadata({
    route,
    title: `${guide.name} GTA VI Location Guide`,
    description: `${guide.fallbackSummary} Read the ${guide.name} Leonida guide with context, related locations, media, and source links.`,
    schemaType: 'Article',
    type: 'article',
    breadcrumbs: [
      { name: 'Leonida Locations', url: `${SITE_ORIGIN}/#leonida` },
      { name: guide.name, url: absoluteUrl(route) },
    ],
    extraJsonLd: [
      {
        '@type': 'Article',
        '@id': `${absoluteUrl(route)}#article`,
        headline: `${guide.name} GTA VI Location Guide`,
        description: cleanDescription(guide.fallbackSummary),
        mainEntityOfPage: { '@id': `${absoluteUrl(route)}#webpage` },
        author: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        isBasedOn: guide.url,
      },
    ],
  })
}

export function createSeoMetadata({ route, state = { users: [] }, currentProfile = null }) {
  const cleanRoute = canonicalPath(route)

  if (cleanRoute === '/community') return communityMetadata()
  if (cleanRoute === '/shop') return shopMetadata()
  if (cleanRoute === '/p2p') return p2pMetadata()
  if (cleanRoute === '/messages') return messagesMetadata()
  if (cleanRoute === '/profile') return ownProfileMetadata(currentProfile)
  if (cleanRoute.startsWith('/profile/')) return publicProfileMetadata(cleanRoute, state)
  if (cleanRoute.startsWith('/locations/')) return locationMetadata(cleanRoute)
  return homeMetadata()
}

export function createJsonLd(metadata) {
  const pageId = `${metadata.canonicalUrl}#webpage`
  const breadcrumbId = `${metadata.canonicalUrl}#breadcrumb`
  const breadcrumbs = metadata.breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/favicon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: 'en-US',
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      },
      {
        '@type': metadata.schemaType,
        '@id': pageId,
        url: metadata.canonicalUrl,
        name: metadata.title,
        description: metadata.description,
        image: metadata.image,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        breadcrumb: { '@id': breadcrumbId },
        inLanguage: 'en-US',
        about: {
          '@type': 'VideoGame',
          name: 'Grand Theft Auto VI',
          alternateName: 'GTA 6',
          publisher: {
            '@type': 'Organization',
            name: 'Rockstar Games',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: breadcrumbs,
      },
      ...metadata.extraJsonLd,
    ],
  }
}

export const SITEMAP_ROUTES = [
  '/',
  '/community',
  '/shop',
  '/p2p',
  ...LOCATION_GUIDES.map((guide) => guide.path),
]

export const NOINDEX_PRERENDER_ROUTES = [
  '/profile',
  '/messages',
]

export const PRERENDER_ROUTES = [
  ...SITEMAP_ROUTES,
  ...NOINDEX_PRERENDER_ROUTES,
]

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJsonScript(value = '') {
  return String(value).replace(/</g, '\\u003c')
}

export function createStaticSeoHead(metadata) {
  const jsonLd = escapeJsonScript(JSON.stringify(createJsonLd(metadata), null, 2))

  return [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="${escapeHtml(metadata.robots)}" />`,
    `<meta name="author" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta name="application-name" content="${escapeHtml(SITE_NAME)}" />`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:type" content="${escapeHtml(metadata.type)}" />`,
    `<meta property="og:url" content="${escapeHtml(metadata.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(metadata.image)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(metadata.imageAlt)}" />`,
    `<script id="structured-data" type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')
}
