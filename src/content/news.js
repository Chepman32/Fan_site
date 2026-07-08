export const newsArticles = [
  {
    slug: 'gta-vi-release-date-november-19-2026',
    title: 'GTA VI Release Date: November 19, 2026 Launch Window',
    description: 'Track the confirmed GTA VI release date, console platforms, and what remains unknown about PC launch timing, pre-orders, editions, and pricing.',
    category: 'release-date',
    publishedAt: '2026-07-07',
    updatedAt: '2026-07-07',
    author: 'Leonida Loot Editorial',
    image: '/og-image.png',
    body: [
      {
        heading: 'Confirmed launch information',
        paragraphs: [
          'Grand Theft Auto VI is tracked on Leonida Loot with a November 19, 2026 launch date for PlayStation 5 and Xbox Series X/S.',
          'This article keeps official launch information separate from estimates and rumor-heavy topics so readers can quickly understand what is reliable.',
        ],
      },
      {
        heading: 'What is still unknown',
        paragraphs: [
          'PC launch timing, special editions, preload dates, pre-order bundles, and final regional pricing should be treated as unconfirmed until official sources publish final details.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games', url: 'https://www.rockstargames.com/VI' },
      { label: 'Take-Two Interactive', url: 'https://www.take2games.com/' },
    ],
  },
  {
    slug: 'gta-vi-leonida-map-and-vice-city-guide',
    title: 'GTA VI Leonida Map: Vice City, Keys, Wetlands and Regions',
    description: 'Explore GTA VI map clues across Leonida, including Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, and Mount Kalaga.',
    category: 'map',
    publishedAt: '2026-07-07',
    updatedAt: '2026-07-07',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/locations-day.webp',
    body: [
      {
        heading: 'Leonida as the core setting',
        paragraphs: [
          'Leonida is the broad state setting around Grand Theft Auto VI, connecting Vice City, island routes, wetlands, beaches, highways, small towns, and wilderness areas.',
          'The map hub on Leonida Loot links those locations into individual guide pages so visitors can move from broad trailer interest into specific regions.',
        ],
      },
      {
        heading: 'Confirmed versus estimated locations',
        paragraphs: [
          'Location names shown in official and reputable public material are treated differently from community estimates, scale guesses, and speculative map reconstructions.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games GTA VI', url: 'https://www.rockstargames.com/VI' },
      { label: 'IGN GTA VI Wiki', url: 'https://www.ign.com/wikis/gta-6/' },
    ],
  },
  {
    slug: 'gta-vi-characters-lucia-jason-and-leonida-cast',
    title: 'GTA VI Characters: Lucia, Jason and the Leonida Cast',
    description: 'Meet Lucia Caminos, Jason Duval, Cal Hampton, Boobie Ike, DreQuan Priest, Real Dimez, Raul Bautista, and Brian Heder.',
    category: 'characters',
    publishedAt: '2026-07-07',
    updatedAt: '2026-07-07',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/characters.webp',
    body: [
      {
        heading: 'Lead characters',
        paragraphs: [
          'Lucia Caminos and Jason Duval are the central duo currently anchoring public GTA VI character coverage.',
          'Leonida Loot keeps named character summaries, roles, and source links in the character guide so fans can browse cast information without relying on leak claims.',
        ],
      },
      {
        heading: 'Supporting cast and source status',
        paragraphs: [
          'Supporting characters are grouped by public source confidence. Confirmed and reported items are labeled so visitors can distinguish official material from fan interpretation.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games GTA VI', url: 'https://www.rockstargames.com/VI' },
      { label: 'IGN GTA VI Characters', url: 'https://www.ign.com/wikis/gta-6/GTA_6_Characters' },
    ],
  },
  {
    slug: 'gta-vi-vehicles-weapons-and-platform-news',
    title: 'GTA VI Vehicles, Weapons and Platform News Tracker',
    description: 'Follow public GTA VI vehicle, weapon, and platform signals while separating visible trailer evidence from speculation.',
    category: 'vehicles',
    publishedAt: '2026-07-07',
    updatedAt: '2026-07-07',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/vehicles-day.webp',
    body: [
      {
        heading: 'Vehicles and weapons in public media',
        paragraphs: [
          'Trailers and screenshots show a broad Leonida sandbox with cars, bikes, boats, aircraft, firearms, and close-range items, but final gameplay systems remain unconfirmed.',
          'Leonida Loot links vehicle and weapon coverage to dedicated guide pages where each visible item can be reviewed with source context.',
        ],
      },
      {
        heading: 'Platform status',
        paragraphs: [
          'PS5 and Xbox Series X/S are tracked as launch platforms. PC release timing is kept separate until official information is available.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games GTA VI', url: 'https://www.rockstargames.com/VI' },
      { label: 'IGN GTA VI', url: 'https://www.ign.com/games/grand-theft-auto-vi' },
    ],
  },
]

export const newsArticleBySlug = Object.fromEntries(
  newsArticles.map((article) => [article.slug, article]),
)

export function getNewsArticle(slug) {
  return newsArticleBySlug[String(slug || '').toLowerCase()] || null
}
