import {
  SHOP_PRODUCT_BY_SLUG,
  SHOP_PRODUCTS_BY_CATEGORY,
  getShopProductThumbnail,
  shopProductSlug,
} from '../shop/shopData'

export const products = Object.values(SHOP_PRODUCTS_BY_CATEGORY)
  .flat()
  .map((product) => ({
    slug: shopProductSlug(product),
    title: product.title,
    category: product.categoryLabel,
    price: product.price,
    format: product.format,
    resolution: product.resolution,
    previewImages: [getShopProductThumbnail(product), ...(product.images || [])].filter(Boolean),
  }))

export const UNIQUE_PRODUCT_DETAIL_COPY = {
  'vice-nights-broadcast-kit': {
    description: 'A neon-night stream kit for creators who want a Vice City-inspired broadcast package with scene frames, alerts, and social panels.',
    seoDescription: 'Vice Nights Broadcast Kit is an unofficial GTA VI-inspired creator overlay pack with neon stream scenes, alert space, panels, license notes, FAQ, and digital delivery.',
    galleryAlt: 'Vice Nights Broadcast Kit preview gallery',
    longCopy: [
      'Vice Nights Broadcast Kit is built for creators who cover GTA VI news, trailer breakdowns, fan theories, and late-night community streams. The pack leans into a bright nightlife look without using official Rockstar assets, so the channel identity stays fan-made while still feeling close to the Leonida mood viewers expect.',
      'The layouts are meant to solve the practical stream problems first: readable facecam space, room for chat or alerts, enough contrast for game footage, and clean surfaces for social handles. Use it as a full broadcast package for countdown streams, watch parties, commentary segments, or short-form clips that need consistent branding across scenes.',
    ],
    detailSections: [
      {
        title: 'Best fit for',
        body: 'Creators running GTA VI news streams, launch countdown shows, trailer analysis broadcasts, or community nights that need a polished neon package instead of a single flat frame.',
      },
      {
        title: 'Visual direction',
        body: 'Deep night color, cyan and pink trim, and broadcast-safe spacing give the scenes a Vice City-inspired tone while keeping gameplay and camera content readable.',
      },
    ],
    included: [
      'Starting soon, live, be right back, and intermission scene layouts',
      'Facecam frame, alert framing, and lower-third panels',
      'High-resolution PNG files for OBS, Streamlabs, and creator profiles',
    ],
    faq: [
      {
        question: 'Can I use Vice Nights Broadcast Kit on Twitch or YouTube?',
        answer: 'Yes. The license allows personal creator use on streams, videos, and community channels.',
      },
      {
        question: 'Does this include official GTA VI assets?',
        answer: 'No. It is an unofficial fan-made creator asset and does not include Rockstar files, leaked material, or game rips.',
      },
    ],
  },
  'ocean-drive-stream-suite': {
    description: 'A bright coastal stream suite built around beach, neon, and nightlife motifs for GTA VI fan channels and launch countdown streams.',
    seoDescription: 'Ocean Drive Stream Suite is an unofficial GTA VI-inspired coastal overlay pack with stream scenes, social callouts, delivery details, FAQ, and creator license notes.',
    galleryAlt: 'Ocean Drive Stream Suite preview gallery',
    longCopy: [
      'Ocean Drive Stream Suite is the lighter, coastal side of the Leonida Loot shop. It is aimed at creators who want a daytime beach and nightlife crossover rather than a purely dark neon package. The result works well for relaxed fan discussions, map speculation, radio-style shows, and GTA VI countdown streams where the mood should feel energetic but not cluttered.',
      'The product page keeps the buying context visible: what the files are, how they can be used, what is not included, and how the unofficial license works. That makes it useful as a standalone detail page rather than just another thumbnail in a large catalog grid.',
    ],
    detailSections: [
      {
        title: 'Best fit for',
        body: 'Fan channels, beach-themed stream layouts, GTA VI launch watch parties, and creator profiles that need a bright coastal look with space for overlays and alerts.',
      },
      {
        title: 'Visual direction',
        body: 'Coastal colors, clean broadcast panels, and warm neon accents help the suite feel like a Leonida creator package without pretending to be official game art.',
      },
    ],
    included: [
      'Coastal stream scenes with social callouts and donation panel space',
      'Creator-ready PNG overlays with wide-screen layouts',
      'Color-safe files for fan streams, watch parties, and commentary videos',
    ],
    faq: [
      {
        question: 'What file format is delivered?',
        answer: 'The shop delivers a PNG pack prepared for common streaming and creator tools.',
      },
      {
        question: 'Can I resell the Ocean Drive Stream Suite?',
        answer: 'No. The license is for personal creator use and does not allow resale or redistribution.',
      },
    ],
  },
  'neon-storm-overlay-bundle': {
    description: 'A darker neon overlay bundle for high-energy gameplay, reaction streams, and GTA VI news commentary.',
    seoDescription: 'Neon Storm Overlay Bundle is an unofficial GTA VI-inspired dark neon stream overlay product with gameplay framing, file details, usage notes, FAQ, and digital delivery.',
    galleryAlt: 'Neon Storm Overlay Bundle preview gallery',
    longCopy: [
      'Neon Storm Overlay Bundle is for streams that need more tension: pursuit talk, police-response clips, reaction videos, and high-energy GTA VI commentary. The design uses darker contrast and electric accent color so creators can frame loud footage without turning the entire broadcast into visual noise.',
      'This page is intentionally more than a generated product stub. It explains the scene role, delivery format, license boundary, and buyer expectations so search visitors can understand the pack before opening checkout. The asset remains unofficial and does not contain extracted game files, leaked material, or Rockstar branding.',
    ],
    detailSections: [
      {
        title: 'Best fit for',
        body: 'Gameplay commentary, chase breakdowns, reaction streams, and creator channels that want a darker overlay package with strong contrast and alert space.',
      },
      {
        title: 'Visual direction',
        body: 'Stormy neon treatment, darker panels, and high-contrast framing keep the product useful for intense footage while preserving room for chat and camera elements.',
      },
    ],
    included: [
      'Gameplay frame, chat-safe layout, and alert areas',
      'Neon storm color treatment for nightlife and chase coverage',
      'Downloadable PNG files suitable for 16:9 broadcast scenes',
    ],
    faq: [
      {
        question: 'Is the bundle editable?',
        answer: 'The delivered files are production-ready PNG assets. Editability depends on the buyer workflow and included file notes.',
      },
      {
        question: 'Is this official Rockstar merchandise?',
        answer: 'No. It is unofficial fan-made creator art inspired by GTA VI themes.',
      },
    ],
  },
  'leonida-heat-scene-pack': {
    description: 'A warm Leonida-themed scene pack for streamers, community hosts, and fan channels covering map, character, and release news.',
    seoDescription: 'Leonida Heat Scene Pack is an unofficial GTA VI-inspired warm stream scene product with creator-use license notes, file details, FAQ, and digital delivery.',
    galleryAlt: 'Leonida Heat Scene Pack preview gallery',
    longCopy: [
      'Leonida Heat Scene Pack gives creators a warmer visual direction for GTA VI coverage. It is designed for community hosts, fan podcasts, map discussions, and long-form release coverage where the broadcast should feel sunny, active, and grounded in Leonida-inspired atmosphere rather than nightclub neon.',
      'The copy, FAQ, and included-file notes on this page are hand-written for this specific product. That matters for search quality because the page explains who the pack is for, how the files are delivered, and what license limits apply instead of repeating the same generated catalog description used across weaker items.',
    ],
    detailSections: [
      {
        title: 'Best fit for',
        body: 'Map explainers, character discussion shows, community streams, and creator profiles that need a warm Leonida-inspired scene set with practical broadcast spacing.',
      },
      {
        title: 'Visual direction',
        body: 'Warm heat, clean creator panels, and location-inspired color make the pack feel suited to Leonida coverage while staying clearly fan-made and unofficial.',
      },
    ],
    included: [
      'Scene pack with gameplay, intermission, and broadcast-ready layouts',
      'Creator-use license for streams, videos, and community profiles',
      'High-resolution files with Leonida-inspired color and atmosphere',
    ],
    faq: [
      {
        question: 'When do I receive the files?',
        answer: 'Digital delivery starts after checkout confirmation and the downloadable item appears with purchase records.',
      },
      {
        question: 'What is the refund rule?',
        answer: 'Review the refund policy before purchase because downloaded digital files generally cannot be returned.',
      },
    ],
  },
}

export const SHOP_ROUTES_WITH_UNIQUE_DETAIL_COPY = Object.keys(UNIQUE_PRODUCT_DETAIL_COPY).map((slug) => `/shop/${slug}`)

export function hasUniqueProductDetailCopy(productOrSlug) {
  const product = typeof productOrSlug === 'string' ? SHOP_PRODUCT_BY_SLUG[productOrSlug] : productOrSlug
  const slug = typeof productOrSlug === 'string' ? productOrSlug : shopProductSlug(product)

  return Boolean(slug && UNIQUE_PRODUCT_DETAIL_COPY[slug])
}

function categoryRelatedProducts(product) {
  const products = SHOP_PRODUCTS_BY_CATEGORY[product.categoryId] || []
  return products
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 3)
    .map((candidate) => ({
      title: candidate.title,
      href: `/shop/${shopProductSlug(candidate)}`,
      image: getShopProductThumbnail(candidate),
    }))
}

export function getProductSeoContent(productOrSlug) {
  const product = typeof productOrSlug === 'string' ? SHOP_PRODUCT_BY_SLUG[productOrSlug] : productOrSlug
  if (!product) return null

  const slug = shopProductSlug(product)
  const uniqueCopy = UNIQUE_PRODUCT_DETAIL_COPY[slug] || {}
  const tags = product.tags || []
  const hasUniqueDetailCopy = hasUniqueProductDetailCopy(slug)

  return {
    slug,
    hasUniqueDetailCopy,
    description: uniqueCopy.description
      || `${product.title} is a unique unofficial GTA VI-inspired ${product.categoryLabel.toLowerCase()} built for creator channels, fan profiles, and launch coverage.`,
    seoDescription: uniqueCopy.seoDescription || '',
    galleryAlt: uniqueCopy.galleryAlt || `${product.title} preview gallery`,
    longCopy: uniqueCopy.longCopy || [
      `${product.title} is currently available as a shop detail page for buyers who need file, price, preview, and license information before checkout.`,
      'This item is kept out of the public search index until it receives hand-written product copy that explains its specific creative direction, intended buyer, delivery contents, and usage guidance.',
    ],
    detailSections: uniqueCopy.detailSections || [
      {
        title: 'Indexing status',
        body: 'This product page is available for shoppers, but it is marked noindex until unique long-form copy is written for this exact product.',
      },
      {
        title: 'Usage boundary',
        body: 'The item remains an unofficial fan-made creator asset and should not be presented as Rockstar Games material.',
      },
    ],
    included: uniqueCopy.included || [
      `${product.format} prepared for ${product.resolution}`,
      `${product.categoryLabel} with ${tags.slice(0, 3).join(', ') || 'creator-ready styling'}`,
      'Personal creator-use license for fan streams, videos, and community profiles',
    ],
    faq: uniqueCopy.faq || [
      {
        question: `What is included with ${product.title}?`,
        answer: `The product includes ${product.format.toLowerCase()} prepared for ${product.resolution} creator workflows.`,
      },
      {
        question: 'Is this an official GTA VI product?',
        answer: 'No. Leonida Loot shop items are unofficial fan-made creator assets and do not include official Rockstar files.',
      },
    ],
    relatedProducts: categoryRelatedProducts(product),
  }
}

export const featuredProductRoutes = SHOP_ROUTES_WITH_UNIQUE_DETAIL_COPY
