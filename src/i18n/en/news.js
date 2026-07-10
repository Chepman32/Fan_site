const releaseSlug = 'gta-vi-release-date-november-19-2026'
const mapSlug = 'gta-vi-leonida-map-and-vice-city-guide'
const charactersSlug = 'gta-vi-characters-lucia-jason-and-leonida-cast'
const vehiclesSlug = 'gta-vi-vehicles-weapons-and-platform-news'

export const newsTranslationEn = {
  badge: 'IGN COVERAGE',
  title: 'LATEST',
  titleHighlight: 'UPDATES',
  loading: 'Preparing latest news',
  showMore: 'Show more',
  showLess: 'Show less',
  showing: 'Showing',
  of: 'of',
  justNow: 'Just now',
  timeAgo: { year: 'year', month: 'month', week: 'week', day: 'day', hour: 'hour', minute: 'minute' },
  pageBadge: 'GTA VI updates',
  pageTitle: 'GTA VI News',
  pageDescription: 'Follow GTA VI release updates, Rockstar announcements, trailer analysis, Leonida map details, characters, vehicles, weapons, and platform news from one static news hub.',
  linksLabel: 'News hub links',
  links: {
    about: 'About GTA VI',
    leonida: 'Leonida guide',
    community: 'Community',
    shop: 'Creator shop',
  },
  featuredLabel: 'Featured article',
  updatedLabel: 'Updated',
  lastUpdatedLabel: 'Last updated',
  readFeatured: 'Read featured article',
  confirmedKicker: 'Latest confirmed updates',
  confirmedTitle: 'Latest confirmed updates',
  listKicker: 'Article cards',
  listTitle: 'GTA VI article list',
  categoriesLabel: 'News categories',
  sourceName: 'Leonida Loot',
  readArticle: 'Read article',
  article: {
    backToNews: 'Back to news',
    galleryLabel: 'IGN gallery',
    imageViaIgn: 'Image via IGN',
    kicker: 'IGN coverage',
    loading: 'Preparing news article',
    openOnIgn: (title) => `Open ${title} on IGN`,
    openSourceOnIgn: 'Open source on IGN',
    parsedUnavailable: 'The article could not be parsed yet.',
    source: 'Source',
    sourceRefreshUnavailable: (message) => `Source refresh unavailable: ${message}`,
    sources: 'Sources',
    unavailable: 'News article unavailable',
    videoLabel: 'IGN video',
  },
  showingCount: (visible, total) => `Showing ${visible} of ${total}`,
  categoryLabels: {
    'release-date': 'release-date',
    map: 'map',
    characters: 'characters',
    vehicles: 'vehicles',
  },
  articles: {
    [releaseSlug]: {
      title: 'GTA VI Release Date: November 19, 2026 Launch Window',
      description: 'Track the confirmed GTA VI release date, console platforms, and what remains unknown about PC launch timing, pre-orders, editions, and pricing.',
    },
    [mapSlug]: {
      title: 'GTA VI Leonida Map: Vice City, Keys, Wetlands and Regions',
      description: 'Explore GTA VI map clues across Leonida, including Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, and Mount Kalaga.',
    },
    [charactersSlug]: {
      title: 'GTA VI Characters: Lucia, Jason and the Leonida Cast',
      description: 'Meet Lucia Caminos, Jason Duval, Cal Hampton, Boobie Ike, DreQuan Priest, Real Dimez, Raul Bautista, and Brian Heder.',
    },
    [vehiclesSlug]: {
      title: 'GTA VI Vehicles, Weapons and Platform News Tracker',
      description: 'Follow public GTA VI vehicle, weapon, and platform signals while separating visible trailer evidence from speculation.',
    },
  },
}
