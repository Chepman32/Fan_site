export const TRUST_PAGES = [
  {
    slug: 'buyer-protection',
    title: 'Buyer Protection',
    description: 'How Leonida Loot handles marketplace expectations, digital delivery, seller contact, and USDT TRC20 checkout safety.',
    sections: [
      {
        title: 'Before you buy',
        body: 'Review the listing description, preview images, delivery method, license terms, file details, and seller profile before sending payment. Marketplace assets should be fan-made and clearly unofficial.',
      },
      {
        title: 'Crypto checkout',
        body: 'Eligible P2P listings use USDT TRC20 settlement through the platform wallet before seller payout. Always verify the displayed amount, network, address, and transaction hash.',
      },
      {
        title: 'After purchase',
        body: 'Keep your transaction hash and seller messages. If a seller cannot deliver the described digital item, collect the listing URL, payment details, and conversation context for review.',
      },
    ],
  },
  {
    slug: 'seller-policy',
    title: 'Seller Policy',
    description: 'Rules for listing fan-made GTA VI-inspired creator assets, services, file bundles, and digital goods on Leonida Loot.',
    sections: [
      {
        title: 'Rights confirmation',
        body: 'Only list files you created, own, or have permission to sell. Do not upload official Rockstar Games assets, leaked game files, copyrighted screenshots, or impersonation material.',
      },
      {
        title: 'Listing quality',
        body: 'Use accurate titles, original preview images, clear file formats, visible license terms, delivery expectations, and honest compatibility notes.',
      },
      {
        title: 'Payout expectations',
        body: 'Crypto listings require a valid TRON wallet address. Seller payout is calculated after platform commission when the buyer payment is verified by the backend settlement flow.',
      },
    ],
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    description: 'Refund expectations for downloadable shop items and P2P marketplace purchases on Leonida Loot.',
    sections: [
      {
        title: 'Digital delivery',
        body: 'Most products are digital files delivered immediately or by seller handoff. Refund eligibility depends on failed delivery, materially inaccurate listing descriptions, or duplicate payment review.',
      },
      {
        title: 'Marketplace disputes',
        body: 'For P2P purchases, buyers should message the seller first. Leonida Loot may use transaction hashes, deal records, listing details, and message history to review settlement issues.',
      },
      {
        title: 'Non-refundable cases',
        body: 'A completed download or delivered file is generally not refundable because the item cannot be returned. Exceptions may apply when the file is missing, corrupted, or misrepresented.',
      },
    ],
  },
  {
    slug: 'dmca',
    title: 'DMCA and Copyright',
    description: 'Copyright reporting information for Leonida Loot fan content, marketplace listings, post media, and downloadable files.',
    sections: [
      {
        title: 'Unofficial fan site',
        body: 'Leonida Loot is an unofficial fan project and marketplace. Grand Theft Auto, GTA, Rockstar Games, and related marks belong to their respective owners.',
      },
      {
        title: 'Report infringing content',
        body: 'Rights holders can request review of posts, listings, files, images, or pages that appear to use protected material without permission.',
      },
      {
        title: 'Seller responsibility',
        body: 'Sellers must not upload official assets, leaks, ripped files, trademark impersonation, or content they do not have rights to distribute.',
      },
    ],
  },
  {
    slug: 'content-policy',
    title: 'Content Policy',
    description: 'Content safety and intellectual-property rules for Leonida Loot community posts, uploads, files, and marketplace listings.',
    sections: [
      {
        title: 'Allowed content',
        body: 'Fan-made overlays, emotes, banners, guides, creator services, and discussion posts are allowed when they are original, clearly unofficial, and accurately described.',
      },
      {
        title: 'Prohibited content',
        body: 'Do not post leaks, official game files, stolen artwork, malware, phishing links, impersonation material, hate content, harassment, or files that violate a third party’s rights.',
      },
      {
        title: 'Moderation',
        body: 'Listings and posts may be removed when they create legal risk, platform abuse, payment risk, or confusion about affiliation with Rockstar Games or Take-Two.',
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms',
    description: 'General terms for using Leonida Loot community, shop, marketplace, messaging, and crypto checkout features.',
    sections: [
      {
        title: 'Use of the site',
        body: 'Use Leonida Loot lawfully and responsibly. You are responsible for your posts, files, messages, listings, wallet addresses, and purchase decisions.',
      },
      {
        title: 'Marketplace activity',
        body: 'P2P sellers and buyers agree to provide accurate information, avoid prohibited material, and understand that crypto transactions can be difficult or impossible to reverse.',
      },
      {
        title: 'Unofficial status',
        body: 'Leonida Loot is not affiliated with Rockstar Games or Take-Two Interactive. References to GTA VI describe fan discussion and unofficial creator assets.',
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    description: 'Privacy overview for Leonida Loot accounts, community profiles, messages, purchases, analytics, and newsletter consent records.',
    sections: [
      {
        title: 'Account data',
        body: 'Firebase Auth and Firestore support profiles, posts, messages, purchases, listings, and settings. Some profile and public content is visible to other visitors.',
      },
      {
        title: 'Payments and files',
        body: 'P2P settlement records may include buyer, seller, listing, transaction hash, payout status, and audit fields. File uploads may be bridged through server-side Telegram storage.',
      },
      {
        title: 'Newsletter consent',
        body: 'Newsletter subscriptions are created through an authenticated backend function so email consent can be recorded and synchronized without exposing provider secrets.',
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'Contact Leonida Loot about marketplace issues, copyright reports, seller policy, buyer protection, and community safety.',
    sections: [
      {
        title: 'Marketplace support',
        body: 'For a purchase or payout issue, include the listing URL, transaction hash, account email, seller name, and a concise description of what happened.',
      },
      {
        title: 'Copyright reports',
        body: 'For copyright or trademark concerns, include the exact URL, the protected work, your relationship to the rights holder, and the action requested.',
      },
      {
        title: 'General feedback',
        body: 'Community, guide, and shop feedback helps prioritize better pages, clearer policies, and safer marketplace behavior.',
      },
    ],
  },
]

export const TRUST_PAGE_BY_SLUG = Object.fromEntries(
  TRUST_PAGES.map((page) => [page.slug, page]),
)

export function getTrustPage(slug) {
  return TRUST_PAGE_BY_SLUG[String(slug || '').toLowerCase()] || null
}
