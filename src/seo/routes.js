import { newsArticles } from '../content/news'
import { LOCATION_GUIDES } from '../data/ignWiki'
import { SEO_GUIDES } from '../data/guideContent'
import { LEONIDA_SECTIONS } from '../data/leonidaSections'
import { TRUST_PAGES } from '../data/trustPages'
import { P2P_SEED_LISTING_ROUTES, P2P_SEED_LISTINGS, p2pListingSlug } from '../p2p/p2pData'
import { SHOP_PRODUCT_ROUTES, SHOP_PRODUCT_BY_SLUG, shopProductSlug } from '../shop/shopData'
import { getProductSeoContent, hasUniqueProductDetailCopy } from '../content/products'

export const SITE_ORIGIN = 'https://leonidaloot.com'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`

function absoluteUrl(path = '/') {
  return new URL(path, SITE_ORIGIN).toString()
}

function canonicalPath(path = '/') {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function route({
  path,
  type,
  title,
  description,
  h1,
  robots = 'index,follow',
  priority = 0.7,
  changefreq = 'monthly',
  jsonLdTypes = ['BreadcrumbList'],
  ogImage = DEFAULT_OG_IMAGE,
}) {
  const cleanPath = canonicalPath(path)

  return {
    path: cleanPath,
    type,
    title,
    description,
    h1,
    canonical: absoluteUrl(cleanPath),
    robots,
    ogImage,
    priority,
    changefreq,
    jsonLdTypes,
  }
}

const staticRoutes = [
  route({
    path: '/',
    type: 'home',
    title: 'Leonida Loot | GTA VI Fan Hub, News, Guides & Creator Marketplace',
    description: 'Track GTA VI news, release updates, Leonida map details, characters, vehicles, weapons, and fan-made creator assets in one unofficial hub.',
    h1: 'GTA VI Fan Hub & Creator Marketplace',
    priority: 1,
    changefreq: 'daily',
    jsonLdTypes: ['Organization', 'WebSite', 'CollectionPage'],
  }),
  route({
    path: '/news',
    type: 'newsIndex',
    title: 'GTA VI News, Release Updates & Rockstar Announcements | Leonida Loot',
    description: 'Follow GTA VI release updates, Rockstar announcements, trailer analysis, map details, characters, vehicles, and platform news.',
    h1: 'GTA VI News',
    priority: 0.9,
    changefreq: 'daily',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  }),
  route({
    path: '/about',
    type: 'about',
    title: 'GTA VI Release Countdown, Price & Development Stats | Leonida Loot',
    description: 'Track the GTA VI release countdown and compare official launch details with clearly labeled budget, team-size, and map estimates.',
    h1: 'Inside GTA VI',
    priority: 0.85,
    changefreq: 'weekly',
    jsonLdTypes: ['Article', 'BreadcrumbList'],
  }),
  route({
    path: '/about-gta-vi',
    type: 'about',
    title: 'About GTA VI: Release Countdown, Price & Development Stats | Leonida Loot',
    description: 'Read the Leonida Loot GTA VI overview with release countdown, platform status, price notes, development estimates, and source links.',
    h1: 'Inside GTA VI',
    robots: 'noindex,follow',
    jsonLdTypes: ['Article', 'BreadcrumbList'],
  }),
  route({
    path: '/leonida',
    type: 'guideIndex',
    title: 'Leonida GTA VI World Guide | Leonida Loot',
    description: 'Explore Leonida characters, locations, vehicles, weapons, and in-game social media through focused GTA VI guide collections.',
    h1: 'Leonida World Guide',
    priority: 0.9,
    changefreq: 'weekly',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  }),
  route({
    path: '/shop',
    type: 'shopIndex',
    title: 'GTA VI Fan Assets, Stream Overlays & Creator Packs | Leonida Loot Shop',
    description: 'Browse unofficial GTA VI-inspired stream overlays, emote packs, profile banners, and creator packs with digital delivery and USDT checkout.',
    h1: 'Stream-ready GTA VI assets',
    priority: 0.85,
    changefreq: 'weekly',
    jsonLdTypes: ['CollectionPage', 'Product', 'Offer', 'BreadcrumbList'],
  }),
  route({
    path: '/p2p',
    type: 'marketplaceIndex',
    title: 'GTA VI Fan Asset Marketplace | Buy & Sell Creator Goods',
    description: 'Buy and sell unofficial GTA VI-inspired creator assets, stream overlays, profile banners, emotes, and fan-made digital goods.',
    h1: 'GTA VI Fan Asset Marketplace',
    priority: 0.85,
    changefreq: 'daily',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  }),
  route({
    path: '/community',
    type: 'community',
    title: 'GTA VI Community Feed | Leonida Loot',
    description: 'Join Leonida Loot community posts, rumors, source tracking, polls, reactions, and GTA VI fan discussion.',
    h1: 'Community',
    priority: 0.8,
    changefreq: 'daily',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  }),
  route({
    path: '/profile',
    type: 'private',
    title: 'Your profile | Leonida Loot',
    description: 'Manage your Leonida Loot GTA VI community profile, posts, bookmarks, purchases, badges, and saved sources.',
    h1: 'Your profile',
    robots: 'noindex,follow',
    jsonLdTypes: ['BreadcrumbList'],
  }),
  route({
    path: '/messages',
    type: 'private',
    title: 'Messages | Leonida Loot',
    description: 'Private Leonida Loot direct messages for P2P buyers, sellers, and signed-in community members.',
    h1: 'Messages',
    robots: 'noindex,follow',
    jsonLdTypes: ['BreadcrumbList'],
  }),
  route({
    path: '/settings',
    type: 'private',
    title: 'Settings | Leonida Loot',
    description: 'Manage Leonida Loot account security, privacy, P2P seller defaults, and synced personalization preferences.',
    h1: 'Settings',
    robots: 'noindex,follow',
    jsonLdTypes: ['BreadcrumbList'],
  }),
]

const leonidaSectionRoutes = LEONIDA_SECTIONS.map((section) => {
  const routeCopy = {
    characters: {
      title: 'GTA VI Characters: Lucia, Jason & Confirmed Cast | Leonida Loot',
      description: 'Meet Lucia Caminos, Jason Duval, Cal Hampton, Boobie Ike, DreQuan Priest, Real Dimez, Raul Bautista, Brian Heder, and the GTA VI cast.',
      h1: 'GTA VI Characters',
    },
    locations: {
      title: 'GTA VI Leonida Locations: Vice City, Keys & Map Regions | Leonida Loot',
      description: 'Explore GTA VI Leonida locations including Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga, roads, beaches, hotels, and highways.',
      h1: 'GTA VI Leonida Locations',
    },
    vehicles: {
      title: 'GTA VI Vehicles: Cars, Bikes, Boats & Aircraft | Leonida Loot',
      description: 'Track GTA VI vehicle references across cars, motorcycles, boats, aircraft, service vehicles, highways, beaches, and Leonida road scenes.',
      h1: 'GTA VI Vehicles',
    },
    weapons: {
      title: 'GTA VI Weapons: Firearms, Melee Items & Visible Arsenal | Leonida Loot',
      description: 'Review public GTA VI weapon references with confirmed-versus-reported context for pistols, rifles, SMGs, melee items, and visible trailer clues.',
      h1: 'GTA VI Weapons',
    },
    'social-media': {
      title: 'GTA VI Social Media: In-Game Feeds, Accounts & Viral Clips | Leonida Loot',
      description: 'Follow GTA VI in-game social media references, fictional accounts, viral Leonida clips, music-world links, and source boundaries.',
      h1: 'GTA VI Social Media',
    },
  }[section.id]

  return route({
    path: section.href,
    type: 'guidePage',
    title: routeCopy.title,
    description: routeCopy.description,
    h1: routeCopy.h1,
    priority: 0.82,
    changefreq: 'weekly',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  })
})

const guideRoutes = [
  route({
    path: '/guides',
    type: 'guideIndex',
    title: 'GTA VI Guides: Release Date, Map, Characters, Vehicles & Weapons | Leonida Loot',
    description: 'Read GTA VI guides for release date, platforms, trailers, Leonida map clues, Lucia, Jason, vehicles, weapons, and confirmed details.',
    h1: 'GTA VI Guides',
    priority: 0.82,
    changefreq: 'weekly',
    jsonLdTypes: ['CollectionPage', 'BreadcrumbList'],
  }),
  ...SEO_GUIDES.map((guide) => route({
    path: `/guides/${guide.slug}`,
    type: 'guidePage',
    title: `${guide.title} | Leonida Loot`,
    description: guide.summary,
    h1: guide.title,
    priority: 0.72,
    changefreq: 'monthly',
    jsonLdTypes: ['Article', 'BreadcrumbList'],
  })),
]

const articleRoutes = newsArticles.map((article) => route({
  path: `/news/${article.slug}`,
  type: 'newsArticle',
  title: `${article.title} | Leonida Loot`,
  description: article.description,
  h1: article.title,
  priority: 0.78,
  changefreq: 'weekly',
  jsonLdTypes: ['Article', 'BreadcrumbList'],
  ogImage: article.image?.startsWith('http') ? article.image : absoluteUrl(article.image || '/og-image.png'),
}))

const productRoutes = SHOP_PRODUCT_ROUTES.map((path) => {
  const slug = path.slice('/shop/'.length)
  const product = SHOP_PRODUCT_BY_SLUG[slug]
  const title = product?.title || slug
  const productContent = getProductSeoContent(slug)
  const isIndexable = hasUniqueProductDetailCopy(slug)

  return route({
    path,
    type: 'product',
    title: `${title} | Leonida Loot Shop`,
    description: productContent?.seoDescription
      || `${title} is an unofficial GTA VI-inspired ${product?.categoryLabel?.toLowerCase() || 'creator asset'} with digital delivery, file details, license terms, FAQ, and related products.`,
    h1: title,
    robots: isIndexable ? 'index,follow' : 'noindex,follow',
    priority: isIndexable && path === `/shop/${shopProductSlug(product)}` ? 0.66 : 0.25,
    changefreq: 'monthly',
    jsonLdTypes: ['Product', 'Offer', 'FAQPage', 'BreadcrumbList'],
  })
})

const listingRoutes = P2P_SEED_LISTING_ROUTES.map((path) => {
  const slug = path.slice('/marketplace/'.length)
  const listing = P2P_SEED_LISTINGS.find((candidate) => p2pListingSlug(candidate) === slug)
  const title = listing?.title || slug

  return route({
    path,
    type: 'marketplaceListing',
    title: `${title} | Leonida Loot Marketplace`,
    description: `${title} is an unofficial GTA VI-inspired P2P marketplace listing with preview images, file details, license notes, seller delivery, and buyer-protection guidance.`,
    h1: title,
    priority: 0.68,
    changefreq: 'weekly',
    jsonLdTypes: ['Product', 'Offer', 'FAQPage', 'BreadcrumbList'],
  })
})

const locationRoutes = LOCATION_GUIDES.map((guide) => route({
  path: guide.path,
  type: 'guidePage',
  title: `${guide.name} GTA VI Location Guide | Leonida Loot`,
  description: `${guide.fallbackSummary} Read the ${guide.name} Leonida guide with context, related locations, media, and source links.`,
  h1: `${guide.name} GTA VI Location Guide`,
  priority: 0.72,
  changefreq: 'monthly',
  jsonLdTypes: ['Article', 'BreadcrumbList'],
}))

const trustRoutes = TRUST_PAGES.map((page) => route({
  path: `/${page.slug}`,
  type: 'legal',
  title: `${page.title} | Leonida Loot`,
  description: page.description,
  h1: page.title,
  priority: 0.45,
  changefreq: 'monthly',
  jsonLdTypes: ['BreadcrumbList'],
}))

export const seoRoutes = [
  ...staticRoutes,
  ...guideRoutes,
  ...leonidaSectionRoutes,
  ...articleRoutes,
  ...productRoutes,
  ...listingRoutes,
  ...locationRoutes,
  ...trustRoutes,
]

const routeMap = new Map(seoRoutes.map((config) => [config.path, config]))

export function getSeoRouteConfig(path) {
  return routeMap.get(canonicalPath(path)) || null
}

export const indexableSeoRoutes = seoRoutes.filter((config) => config.robots === 'index,follow')
export const noindexSeoRoutes = seoRoutes.filter((config) => config.robots.includes('noindex'))
