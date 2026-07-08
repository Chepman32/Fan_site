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

const FEATURED_PRODUCT_COPY = {
  'vice-nights-broadcast-kit': {
    description: 'A neon-night stream kit for creators who want a Vice City-inspired broadcast package with scene frames, alerts, and social panels.',
    galleryAlt: 'Vice Nights Broadcast Kit preview gallery',
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
    galleryAlt: 'Ocean Drive Stream Suite preview gallery',
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
    galleryAlt: 'Neon Storm Overlay Bundle preview gallery',
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
    galleryAlt: 'Leonida Heat Scene Pack preview gallery',
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
  const featuredCopy = FEATURED_PRODUCT_COPY[slug] || {}
  const tags = product.tags || []

  return {
    slug,
    description: featuredCopy.description
      || `${product.title} is a unique unofficial GTA VI-inspired ${product.categoryLabel.toLowerCase()} built for creator channels, fan profiles, and launch coverage.`,
    galleryAlt: featuredCopy.galleryAlt || `${product.title} preview gallery`,
    included: featuredCopy.included || [
      `${product.format} prepared for ${product.resolution}`,
      `${product.categoryLabel} with ${tags.slice(0, 3).join(', ') || 'creator-ready styling'}`,
      'Personal creator-use license for fan streams, videos, and community profiles',
    ],
    faq: featuredCopy.faq || [
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

export const featuredProductRoutes = Object.keys(FEATURED_PRODUCT_COPY).map((slug) => `/shop/${slug}`)
