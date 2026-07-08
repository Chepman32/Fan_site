import { getLocationGuideBySlug } from '../data/ignWiki'
import { SEO_GUIDES, getSeoGuide } from '../data/guideContent'
import { LEONIDA_SECTIONS, getLeonidaSection } from '../data/leonidaSections'
import { TRUST_PAGES, getTrustPage } from '../data/trustPages'
import { getNewsArticle, newsArticles } from '../content/news'
import { getProductSeoContent, hasUniqueProductDetailCopy } from '../content/products'
import { getMarketplaceListingContent } from '../content/marketplaceListings'
import {
  P2P_SEED_LISTING_BY_SLUG,
  formatP2PPrice,
  p2pCategoryLabel,
  p2pListingSlug,
} from '../p2p/p2pData'
import {
  SHOP_PRODUCT_BY_SLUG,
  formatShopPrice,
  getShopProductThumbnail,
  shopProductSlug,
} from '../shop/shopData'
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from './jsonLd'
import { getSeoRouteConfig, indexableSeoRoutes, noindexSeoRoutes } from './routes'

export const SITE_ORIGIN = 'https://leonidaloot.com'
export const SITE_NAME = 'Leonida Loot'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`
export const DEFAULT_IMAGE_ALT = 'Leonida Loot GTA VI fan hub preview'

const DEFAULT_DESCRIPTION = 'Leonida Loot is a GTA VI fan hub with Vice City and Leonida guides, news, media, community posts, creator shop assets, and a P2P digital marketplace.'
const SHOP_CATEGORIES = [
  'GTA VI stream overlays',
  'Leonida profile banners',
  'GTA VI emote packs',
]
const SHORT_LEONIDA_ALIAS_ROUTE_TO_SECTION = {
  '/characters': 'characters',
  '/locations': 'locations',
  '/vehicles': 'vehicles',
  '/weapons': 'weapons',
  '/social-media': 'social-media',
}
const TRUST_ROUTES = TRUST_PAGES.map((page) => `/${page.slug}`)

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
  const fullTitle = title.includes(SITE_NAME) || title.includes(' | ') ? title : `${title} | ${SITE_NAME}`

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
  const routeConfig = getSeoRouteConfig('/')

  return pageMetadata({
    route: '/',
    title: routeConfig.title,
    description: routeConfig.description,
    schemaType: 'CollectionPage',
    extraJsonLd: [
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/#gta-vi-hubs`,
        name: 'Leonida Loot GTA VI hub sections',
        itemListElement: [
          ['News', '/news'],
          ['Guides', '/guides'],
          ['Locations', '/leonida/locations'],
          ['Characters', '/leonida/characters'],
          ['Vehicles', '/leonida/vehicles'],
          ['Weapons', '/leonida/weapons'],
          ['Shop', '/shop'],
          ['P2P marketplace', '/p2p'],
          ['Community', '/community'],
          ['About GTA VI', '/about'],
        ].map(([name, path], index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name,
          url: absoluteUrl(path),
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
    title: 'GTA VI Fan Assets, Stream Overlays & Creator Packs | Leonida Loot Shop',
    description: 'Browse unofficial GTA VI-inspired stream overlays, emote packs, profile banners, and creator packs with digital delivery and USDT checkout.',
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

function p2pMetadata(route = '/p2p') {
  const routeConfig = getSeoRouteConfig('/p2p')

  return pageMetadata({
    route,
    title: routeConfig.title,
    description: 'Buy and sell unofficial GTA VI-inspired stream overlays, emotes, guides, services, profile banners, and fan-made creator goods with seller-to-buyer messaging.',
    schemaType: 'CollectionPage',
    breadcrumbs: route === '/' ? [] : [{ name: 'P2P Marketplace', url: absoluteUrl(route) }],
    extraJsonLd: [
      {
        '@type': 'Service',
        '@id': `${SITE_ORIGIN}/#marketplace-service`,
        name: 'Leonida Loot P2P digital marketplace',
        serviceType: 'Digital goods marketplace',
        provider: { '@id': `${SITE_ORIGIN}/#organization` },
        areaServed: 'Worldwide',
      },
    ],
  })
}

function leonidaMetadata() {
  return pageMetadata({
    route: '/leonida',
    title: 'Leonida GTA VI World Guide',
    description: 'Explore Leonida characters, locations, vehicles, weapons, and in-game social media through focused GTA VI guide collections.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Leonida', url: absoluteUrl('/leonida') }],
    extraJsonLd: [
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/leonida#field-guide`,
        name: 'Leonida GTA VI field guide',
        itemListElement: LEONIDA_SECTIONS.map((section, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: section.title,
          url: absoluteUrl(section.href),
        })),
      },
    ],
  })
}

function aboutMetadata(route = '/about') {
  const isSeoAlias = route === '/about-gta-vi'
  const routeConfig = getSeoRouteConfig(route)

  return pageMetadata({
    route,
    title: routeConfig?.title || (isSeoAlias ? 'About GTA VI: Release Countdown, Price & Development Stats' : 'GTA VI Release Countdown, Price & Development Stats'),
    description: routeConfig?.description || (isSeoAlias
      ? 'Read the Leonida Loot GTA VI overview with release countdown, platform status, price notes, development estimates, and source links.'
      : 'Track the GTA VI release countdown and compare official launch details with clearly labeled budget, team-size, and map estimates.'),
    robots: routeConfig?.robots || 'index,follow',
    schemaType: 'AboutPage',
    breadcrumbs: [{ name: 'About GTA VI', url: absoluteUrl('/about') }],
    extraJsonLd: [
      {
        '@type': 'VideoGame',
        '@id': `${SITE_ORIGIN}/about#game`,
        name: 'Grand Theft Auto VI',
        alternateName: 'GTA VI',
        datePublished: '2026-11-19',
        gamePlatform: ['PlayStation 5', 'Xbox Series X/S'],
        publisher: {
          '@type': 'Organization',
          name: 'Rockstar Games',
        },
      },
    ],
  })
}

function leonidaSectionMetadata(route) {
  const aliasSectionId = SHORT_LEONIDA_ALIAS_ROUTE_TO_SECTION[route]
  const sectionId = aliasSectionId || route.slice('/leonida/'.length)
  const metadataRoute = aliasSectionId ? `/leonida/${sectionId}` : route
  const section = getLeonidaSection(sectionId)
  const routeConfig = getSeoRouteConfig(metadataRoute)

  if (!section) {
    return pageMetadata({
      route,
      title: 'Leonida Guide Not Found',
      description: 'This Leonida guide was not found. Browse the available GTA VI world guide collections on Leonida Loot.',
      robots: 'noindex,follow',
      breadcrumbs: [{ name: 'Leonida', url: absoluteUrl('/leonida') }],
    })
  }

  return pageMetadata({
    route: metadataRoute,
    title: routeConfig?.title || (section.id === 'characters'
      ? 'GTA VI Characters: Lucia, Jason & Confirmed Cast'
      : `GTA VI ${section.title} Guide`),
    description: routeConfig?.description || section.description,
    robots: aliasSectionId ? 'noindex,follow' : 'index,follow',
    schemaType: 'CollectionPage',
    breadcrumbs: [
      { name: 'Leonida', url: absoluteUrl('/leonida') },
      { name: section.title, url: absoluteUrl(metadataRoute) },
    ],
  })
}

function newsMetadata() {
  const routeConfig = getSeoRouteConfig('/news')

  return pageMetadata({
    route: '/news',
    title: routeConfig.title,
    description: routeConfig.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'News', url: absoluteUrl('/news') }],
    extraJsonLd: [
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/news#latest-updates`,
        name: 'Latest GTA VI news',
        description: 'Static GTA VI release, map, character, vehicle, weapon, and platform coverage on Leonida Loot.',
        itemListElement: newsArticles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.title,
          url: absoluteUrl(`/news/${article.slug}`),
        })),
      },
    ],
  })
}

function guidesMetadata() {
  return pageMetadata({
    route: '/guides',
    title: 'GTA VI Guides: Release Date, Map, Characters, Vehicles & Weapons',
    description: 'Read GTA VI guides for release date, platforms, trailers, Leonida map clues, Lucia, Jason, vehicles, weapons, and confirmed details.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Guides', url: absoluteUrl('/guides') }],
    extraJsonLd: [
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/guides#guide-list`,
        name: 'GTA VI guide library',
        itemListElement: SEO_GUIDES.map((guide, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: guide.title,
          url: absoluteUrl(`/guides/${guide.slug}`),
        })),
      },
    ],
  })
}

function guideMetadata(route) {
  const slug = route.slice('/guides/'.length)
  const guide = getSeoGuide(slug)

  if (!guide) {
    return pageMetadata({
      route,
      title: 'GTA VI Guide Not Found',
      description: 'This GTA VI guide was not found. Browse release date, map, character, vehicle, and weapon guides on Leonida Loot.',
      robots: 'noindex,follow',
      breadcrumbs: [{ name: 'Guides', url: absoluteUrl('/guides') }],
    })
  }

  return pageMetadata({
    route,
    title: guide.title,
    description: guide.summary,
    schemaType: 'Article',
    type: 'article',
    breadcrumbs: [
      { name: 'Guides', url: absoluteUrl('/guides') },
      { name: guide.title, url: absoluteUrl(route) },
    ],
    extraJsonLd: [
      {
        '@type': 'Article',
        '@id': `${absoluteUrl(route)}#article`,
        headline: guide.title,
        description: cleanDescription(guide.summary),
        datePublished: guide.updatedAt,
        dateModified: guide.updatedAt,
        mainEntityOfPage: { '@id': `${absoluteUrl(route)}#webpage` },
        author: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      },
    ],
  })
}

function productImageUrl(product) {
  const image = getShopProductThumbnail(product)
  if (!image) return DEFAULT_OG_IMAGE
  return image.startsWith('http') ? image : absoluteUrl(image)
}

function shopProductMetadata(route) {
  const slug = route.slice('/shop/'.length)
  const product = SHOP_PRODUCT_BY_SLUG[slug]
  const routeConfig = getSeoRouteConfig(route)

  if (!product) {
    return pageMetadata({
      route,
      title: 'Shop Product Not Found',
      description: 'This Leonida Loot shop product was not found. Browse GTA VI-inspired stream overlays, emotes, and profile banners.',
      robots: 'noindex,follow',
      breadcrumbs: [{ name: 'Shop', url: absoluteUrl('/shop') }],
    })
  }

  const productUrl = absoluteUrl(`/shop/${shopProductSlug(product)}`)
  const productContent = getProductSeoContent(product)
  const description = productContent?.seoDescription
    || productContent?.description
    || `${product.title} is an unofficial GTA VI-inspired ${product.categoryLabel.toLowerCase()} for creators, delivered as ${product.format}.`
  const robots = routeConfig?.robots || (hasUniqueProductDetailCopy(product) ? 'index,follow' : 'noindex,follow')

  return pageMetadata({
    route,
    title: routeConfig?.title || `${product.title} | Leonida Loot Shop`,
    description,
    robots,
    schemaType: 'ItemPage',
    breadcrumbs: [
      { name: 'Shop', url: absoluteUrl('/shop') },
      { name: product.title, url: productUrl },
    ],
    extraJsonLd: [
      {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        name: product.title,
        description: cleanDescription(description),
        image: [productImageUrl(product)],
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
        category: product.categoryLabel,
        offers: {
          '@type': 'Offer',
          price: formatShopPrice(product.price),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: productUrl,
        },
      },
      ...(productContent?.faq?.length ? [
        {
          '@type': 'FAQPage',
          '@id': `${productUrl}#faq`,
          mainEntity: productContent.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ] : []),
    ],
  })
}

function marketplaceListingMetadata(route) {
  const slug = route.slice('/marketplace/'.length)
  const listing = P2P_SEED_LISTING_BY_SLUG[slug]
  const routeConfig = getSeoRouteConfig(route)

  if (!listing) {
    return pageMetadata({
      route,
      title: 'Marketplace Listing Not Found',
      description: 'This Leonida Loot P2P listing was not found. Browse active GTA VI-inspired creator assets in the marketplace.',
      robots: 'noindex,follow',
      breadcrumbs: [{ name: 'Marketplace', url: absoluteUrl('/p2p') }],
    })
  }

  const listingUrl = absoluteUrl(`/marketplace/${p2pListingSlug(listing)}`)
  const listingContent = getMarketplaceListingContent(listing)
  const description = listingContent?.longDescription || `${listing.title}: ${listing.description} Unofficial fan-made creator asset with ${listing.deliveryMethod.toLowerCase()}.`

  return pageMetadata({
    route,
    title: routeConfig?.title || `${listing.title} | Leonida Loot Marketplace`,
    description,
    schemaType: 'ItemPage',
    breadcrumbs: [
      { name: 'Marketplace', url: absoluteUrl('/p2p') },
      { name: listing.title, url: listingUrl },
    ],
    extraJsonLd: [
      {
        '@type': 'Product',
        '@id': `${listingUrl}#product`,
        name: listing.title,
        description: cleanDescription(description),
        image: [listing.previewDataUrl?.startsWith('http') ? listing.previewDataUrl : absoluteUrl(listing.previewDataUrl)],
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
        category: p2pCategoryLabel(listing.category),
        offers: {
          '@type': 'Offer',
          price: String(Number(listing.price || 0)),
          priceCurrency: 'USD',
          availability: listing.status === 'sold' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          url: listingUrl,
        },
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Display price',
            value: formatP2PPrice(listing),
          },
        ],
      },
      ...(listingContent?.faq?.length ? [
        {
          '@type': 'FAQPage',
          '@id': `${listingUrl}#faq`,
          mainEntity: listingContent.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ] : []),
    ],
  })
}

function trustMetadata(route) {
  const page = getTrustPage(route.slice(1))

  if (!page) {
    return pageMetadata({
      route,
      title: 'Trust Page Not Found',
      description: 'This Leonida Loot policy page was not found.',
      robots: 'noindex,follow',
    })
  }

  return pageMetadata({
    route,
    title: `${page.title} | Leonida Loot`,
    description: page.description,
    schemaType: 'WebPage',
    breadcrumbs: [{ name: page.title, url: absoluteUrl(route) }],
  })
}

function titleFromSlug(slug = '') {
  const acronyms = new Set(['gta', 'ign', 'p2p', 'pc', 'ps4', 'ps5', 'rdr', 'usdt', 'vi'])
  const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'or', 'the', 'to', 'with'])

  return slug
    .split('-')
    .filter(Boolean)
    .map((part, index) => {
      if (/^\d+s$/.test(part)) return `${part.slice(0, -1)}'s`
      if (acronyms.has(part)) return part.toUpperCase()
      if (index > 0 && lowercaseWords.has(part)) return part
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    })
    .join(' ')
}

function newsArticleMetadata(route) {
  const slug = route.slice('/news/'.length)
  const article = getNewsArticle(slug)
  const routeConfig = getSeoRouteConfig(route)
  const title = article?.title || titleFromSlug(slug) || 'GTA VI News Article'
  const description = article?.description || `${title} - a GTA VI news article mirrored from IGN coverage with source attribution and media links.`

  return pageMetadata({
    route,
    title: routeConfig?.title || title,
    description,
    schemaType: 'Article',
    type: 'article',
    breadcrumbs: [
      { name: 'News', url: absoluteUrl('/news') },
      { name: title, url: absoluteUrl(route) },
    ],
    extraJsonLd: [
      {
        '@type': 'Article',
        '@id': `${absoluteUrl(route)}#article`,
        headline: title,
        description: cleanDescription(description),
        datePublished: article?.publishedAt,
        dateModified: article?.updatedAt,
        mainEntityOfPage: { '@id': `${absoluteUrl(route)}#webpage` },
        author: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
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

function settingsMetadata() {
  return pageMetadata({
    route: '/settings',
    title: 'Settings',
    description: 'Manage Leonida Loot account security, privacy, P2P seller defaults, and synced personalization preferences.',
    robots: 'noindex,follow',
    breadcrumbs: [{ name: 'Settings', url: absoluteUrl('/settings') }],
  })
}

function locationMetadata(route) {
  const isLegacyLocationRoute = route.startsWith('/leonida/locations/')
  const slug = isLegacyLocationRoute
    ? route.slice('/leonida/locations/'.length)
    : route.slice('/locations/'.length)
  const metadataRoute = isLegacyLocationRoute ? `/locations/${slug}` : route
  const guide = getLocationGuideBySlug(slug)

  if (!guide) {
    return pageMetadata({
      route: metadataRoute,
      title: 'Leonida Location Not Found',
      description: 'This Leonida location guide was not found. Browse the available GTA VI Leonida location pages on Leonida Loot.',
      robots: 'noindex,follow',
      breadcrumbs: [
        { name: 'Leonida Locations', url: absoluteUrl('/locations') },
        { name: 'Location not found', url: absoluteUrl(metadataRoute) },
      ],
    })
  }

  return pageMetadata({
    route: metadataRoute,
    title: `${guide.name} GTA VI Location Guide`,
    description: `${guide.fallbackSummary} Read the ${guide.name} Leonida guide with context, related locations, media, and source links.`,
    schemaType: 'Article',
    type: 'article',
    breadcrumbs: [
      { name: 'Leonida Locations', url: absoluteUrl('/locations') },
      { name: guide.name, url: absoluteUrl(metadataRoute) },
    ],
    extraJsonLd: [
      {
        '@type': 'Article',
        '@id': `${absoluteUrl(metadataRoute)}#article`,
        headline: `${guide.name} GTA VI Location Guide`,
        description: cleanDescription(guide.fallbackSummary),
        mainEntityOfPage: { '@id': `${absoluteUrl(metadataRoute)}#webpage` },
        author: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        isBasedOn: guide.url,
      },
    ],
  })
}

export function createSeoMetadata({ route, state = { users: [] }, currentProfile = null }) {
  const cleanRoute = canonicalPath(route)

  if (cleanRoute === '/') return homeMetadata()
  if (cleanRoute === '/community') return communityMetadata()
  if (cleanRoute === '/shop') return shopMetadata()
  if (cleanRoute.startsWith('/shop/')) return shopProductMetadata(cleanRoute)
  if (cleanRoute === '/p2p') return p2pMetadata('/p2p')
  if (cleanRoute.startsWith('/marketplace/')) return marketplaceListingMetadata(cleanRoute)
  if (cleanRoute === '/about' || cleanRoute === '/about-gta-vi') return aboutMetadata(cleanRoute)
  if (cleanRoute === '/guides') return guidesMetadata()
  if (cleanRoute.startsWith('/guides/')) return guideMetadata(cleanRoute)
  if (cleanRoute === '/leonida') return leonidaMetadata()
  if (cleanRoute === '/news') return newsMetadata()
  if (cleanRoute === '/messages') return messagesMetadata()
  if (cleanRoute === '/settings') return settingsMetadata()
  if (cleanRoute === '/profile') return ownProfileMetadata(currentProfile)
  if (cleanRoute.startsWith('/profile/')) return publicProfileMetadata(cleanRoute, state)
  if (SHORT_LEONIDA_ALIAS_ROUTE_TO_SECTION[cleanRoute]) return leonidaSectionMetadata(cleanRoute)
  if (TRUST_ROUTES.includes(cleanRoute)) return trustMetadata(cleanRoute)
  if (cleanRoute.startsWith('/leonida/locations/')) return locationMetadata(cleanRoute)
  if (cleanRoute.startsWith('/locations/')) return locationMetadata(cleanRoute)
  if (cleanRoute.startsWith('/leonida/')) return leonidaSectionMetadata(cleanRoute)
  if (cleanRoute.startsWith('/news/')) return newsArticleMetadata(cleanRoute)
  return homeMetadata()
}

export function createJsonLd(metadata) {
  const pageId = `${metadata.canonicalUrl}#webpage`
  const breadcrumbId = `${metadata.canonicalUrl}#breadcrumb`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd({ siteOrigin: SITE_ORIGIN, siteName: SITE_NAME }),
      websiteJsonLd({ siteOrigin: SITE_ORIGIN, siteName: SITE_NAME, description: DEFAULT_DESCRIPTION }),
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
      breadcrumbJsonLd({ id: breadcrumbId, items: metadata.breadcrumbs }),
      ...metadata.extraJsonLd,
    ],
  }
}

export const SITEMAP_ROUTES = indexableSeoRoutes.map((config) => config.path)

export const NOINDEX_PRERENDER_ROUTES = noindexSeoRoutes.map((config) => config.path)

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
