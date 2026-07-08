import {
  P2P_SEED_LISTING_BY_SLUG,
  P2P_SEED_LISTINGS,
  formatFileSize,
  p2pListingSlug,
} from '../p2p/p2pData'

export const marketplaceListings = P2P_SEED_LISTINGS.map((listing) => ({
  slug: p2pListingSlug(listing),
  title: listing.title,
  shortDescription: listing.description,
  category: listing.category,
  price: listing.price,
  priceCurrency: listing.currency,
  sellerSlug: listing.sellerId,
  deliveryMethod: listing.deliveryMethod,
  previewImages: [listing.previewDataUrl].filter(Boolean),
  status: listing.status,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
  indexable: listing.status !== 'sold',
}))

function listingFiles(listing) {
  return listing.files || []
}

export function getMarketplaceListingContent(listingOrSlug) {
  const listing = typeof listingOrSlug === 'string' ? P2P_SEED_LISTING_BY_SLUG[listingOrSlug] : listingOrSlug
  if (!listing) return null

  const slug = p2pListingSlug(listing)
  const files = listingFiles(listing)
  const fileFormats = Array.from(new Set(files.map((file) => file.name.split('.').pop()?.toUpperCase()).filter(Boolean)))
  const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0)

  return {
    slug,
    title: listing.title,
    shortDescription: listing.description,
    longDescription: `${listing.description} This is an unofficial seller-created listing for GTA VI-inspired creator use. Buyers should confirm delivery details and license expectations before checkout.`,
    sellerName: listing.sellerId.replace(/^user-/, '').replace(/-/g, ' '),
    sellerSlug: listing.sellerId,
    sellerJoinedAt: '2026-05-01',
    sellerRating: 4.8,
    fileName: files[0]?.name || 'seller-delivery-files.zip',
    fileSize: formatFileSize(totalSize),
    fileFormats: fileFormats.length ? fileFormats : ['ZIP'],
    license: 'Personal creator use. No resale, redistribution, official impersonation, leaked assets, or ripped game files.',
    deliveryMethod: listing.deliveryMethod,
    previewImages: [listing.previewDataUrl].filter(Boolean),
    indexable: listing.status !== 'sold',
    faq: [
      {
        question: 'How does this P2P listing get delivered?',
        answer: `The seller lists delivery as ${listing.deliveryMethod.toLowerCase()}. Buyers can use marketplace messaging to confirm timing and file expectations.`,
      },
      {
        question: 'Does Leonida Loot allow official GTA VI files or leaks?',
        answer: 'No. Marketplace listings must be fan-made or seller-owned files and may not include official Rockstar files, leaks, ripped assets, or impersonation material.',
      },
    ],
    relatedListings: P2P_SEED_LISTINGS
      .filter((candidate) => candidate.id !== listing.id)
      .slice(0, 3)
      .map((candidate) => ({
        title: candidate.title,
        href: `/marketplace/${p2pListingSlug(candidate)}`,
        image: candidate.previewDataUrl,
      })),
  }
}
