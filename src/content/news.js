export const gtaViLaunchSources = {
  official: 'https://www.rockstargames.com/VI',
  preload: 'https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10',
  regionalTimes: 'https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s',
  takeTwo: 'https://ir.take2games.com/node/32676/pdf',
  pcReport: 'https://gamesbeat.com/grand-theft-auto-vis-pc-release-is-slated-for-q1-2027/',
  onlineReport: 'https://www.bloomberg.com/features/2026-grand-theft-auto-6-making-of/',
}

export const newsArticles = [
  {
    slug: 'gta-vi-preload-november-10-ps5-xbox',
    title: 'GTA VI Digital Preload Opens on PS5 and Xbox',
    description: 'Digital preorders can start downloading on November 10. Rockstar says to allow up to 212 GB, and Take-Two reaffirmed the November 19 console launch.',
    category: 'release-date',
    publishedAt: '2026-11-09',
    updatedAt: '2026-11-10',
    author: 'Leonida Loot Editorial',
    image: '/og-image.png',
    body: [
      {
        heading: 'When to start downloading',
        paragraphs: [
          'Digital preload for GTA VI starts on November 10. PS5 uses midnight local time; Xbox Series X|S uses a worldwide start at 00:00 UTC. Rockstar says the preload can require up to 212 GB, depending on the console.',
          'Retail editions contain a download code. Those boxes reach retailers starting November 12, when buyers can redeem their codes and preload.',
        ],
      },
      {
        heading: 'When the game unlocks',
        paragraphs: [
          'Rockstar Support lists midnight local time on November 19 for both PS5 and Xbox Series X|S. Take-Two reaffirmed the console launch date in its November 9 earnings release.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Newswire preload announcement', url: gtaViLaunchSources.preload },
      { label: 'Rockstar Support preload FAQ', url: 'https://support.rockstargames.com/articles/7nPqOA2uCbpEQHXx7KVrYd/grand-theft-auto-vi-pre-load-faq' },
      { label: 'Rockstar Support regional release times', url: gtaViLaunchSources.regionalTimes },
      { label: 'Take-Two’s November 9 earnings release', url: gtaViLaunchSources.takeTwo },
    ],
  },
  {
    slug: 'gta-vi-the-festival-miami-november-21',
    title: 'GTA VI Launch Festival Comes to Miami on November 21',
    description: 'Rockstar and PlayStation announced a two-stage live music event at Mana Wynwood, with Travis Scott, Cardi B, Justice and more.',
    category: 'music',
    publishedAt: '2026-11-09',
    updatedAt: '2026-11-09',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/social-media-day.webp',
    body: [
      {
        heading: 'A launch-week concert in Miami',
        paragraphs: [
          'Rockstar announced the festival on November 9. The in-person event takes place at Mana Wynwood in Miami on Saturday, November 21, two days after the console launch.',
          'The event spans two stages. The lineup includes Travis Scott, Cardi B, Justice with a DJ set, Metro Boomin, Tainy, and other artists featured in the game or on its soundtrack.',
        ],
      },
      {
        heading: 'Ticket lottery',
        paragraphs: [
          'The lottery closes November 10 at 4 p.m. ET, with winners drawn at 7 p.m. ET. Winners can buy up to two tickets starting November 11 at noon ET through DICE. Attendees must be at least 17.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Newswire festival announcement', url: 'https://www.rockstargames.com/newswire/article/o39o87a435a25a/grand-theft-auto-vi-the-festival' },
      { label: 'Official festival and ticket information', url: 'https://www.rockstargames.com/VI/gtavi-thefestival' },
    ],
  },
  {
    slug: 'gta-vi-launch-gallery-new-leonida-screenshots',
    title: 'Rockstar Opens the GTA VI Launch Gallery',
    description: 'Browse 39 official screenshots from Rockstar’s November 5 gallery, including Vice City nightlife and a look at the Leonida Keys.',
    category: 'map',
    publishedAt: '2026-11-09',
    updatedAt: '2026-11-10',
    author: 'Leonida Loot Editorial',
    image: 'https://www.rockstargames.com/VI/_next/static/media/Jason_and_Lucia_14.10e7v.06pcm_t.jpg?akim=1&imdensity=1&imwidth=1280',
    body: [
      {
        heading: 'A new look at Vice City and Leonida',
        paragraphs: [
          'Rockstar published its Launch Gallery on November 5. The 39 screenshots include Jason and Lucia at a Fleeca bank, a busy Vice City marina, a dive in the Leonida Keys and a nighttime view of the Grassrivers.',
          'The images offer a closer look at those places and characters. Rockstar plans to make a printable Leonida map and cover art available for free on November 19.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Newswire gallery announcement', url: 'https://www.rockstargames.com/newswire/article/39ak81277255o9/explore-the-grand-theft-auto-vi-launch-gallery' },
      { label: 'Official GTA VI Launch Gallery', url: 'https://www.rockstargames.com/VI/launch-gallery' },
      { label: 'Browse the screenshots on Leonida Loot', url: '/about#official-screenshots' },
      { label: 'Rockstar Newswire map and preload update', url: 'https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10' },
    ],
  },
  {
    slug: 'gta-vi-pc-release-and-online-reports',
    title: 'GTA VI PC and Online: What’s Been Reported',
    description: 'GamesBeat reports a possible early 2027 PC release, and Bloomberg expects an online mode in 2027. Rockstar has announced neither date.',
    category: 'reporting',
    status: 'reported',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    author: 'Leonida Loot Editorial',
    image: '/og-image.png',
    body: [
      {
        heading: 'PC: An early 2027 window has been reported',
        paragraphs: [
          'On October 13, GamesBeat reported that Rockstar was targeting the first three months of 2027 for the PC version, citing four unnamed industry sources. Rockstar has not announced a PC release window or system requirements.',
        ],
      },
      {
        heading: 'Online: Reporting points to 2027',
        paragraphs: [
          'Bloomberg’s October 14 report on the making of GTA VI says the planned online component is expected in 2027. Rockstar has described the November 19 console release as a single-player game and has not announced an online launch date.',
          'On November 9, GamesRadar+ covered claims that PlayStation Store metadata references multiplayer activities. Even if those references are accurate, they do not establish when an online mode will be available.',
        ],
      },
    ],
    sources: [
      { label: 'GamesBeat’s original PC report', url: gtaViLaunchSources.pcReport },
      { label: 'Bloomberg’s report from Rockstar North', url: gtaViLaunchSources.onlineReport },
      { label: 'GamesRadar+ on the PlayStation Store claims', url: 'https://www.gamesradar.com/games/grand-theft-auto/gta-6-launch-files-already-hint-at-online-multiplayer-playstation-store-sleuth-reports-leading-to-hopes-we-wont-be-waiting-for-a-gta-online-follow-up-for-long/' },
      { label: 'Rockstar’s console preorder announcement', url: 'https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25' },
    ],
  },
  {
    slug: 'gta-vi-music-justice-score-radio-soundtrack',
    title: 'GTA VI Music: Justice Score, Soundtrack and In-Game Radio',
    description: 'Rockstar has previewed six radio stations and dated two music releases: The Album on November 19 and the Justice score on December 11.',
    category: 'music',
    publishedAt: '2026-11-09',
    updatedAt: '2026-11-09',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/social-media.webp',
    body: [
      {
        heading: 'Two releases on separate dates',
        paragraphs: [
          'Rockstar lists November 19 for Grand Theft Auto VI: The Album, a 34-track soundtrack featuring multiple artists. The 30-track Original Score by Justice follows December 11 on streaming services, CD and vinyl.',
          'The score adapts to what players do during Jason and Lucia’s story. Rockstar’s music page has already released previews of “Flower in a Hurricane” and “Pusher.”',
        ],
      },
      {
        heading: 'Radio previews from Leonida',
        paragraphs: [
          'Rockstar’s site has sample broadcasts for Cocoteo, Back Country, Afro Bank FM, The Chamber, Flash FM, and Dirty South Classics. Those six previews cover Latin music, country, African music, metal, pop, and Southern hip-hop.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar’s GTA VI music hub', url: 'https://www.rockstargames.com/VI/music' },
      { label: 'Rockstar Newswire Justice score announcement', url: 'https://www.rockstargames.com/newswire/article/39ak8a12395591/grand-theft-auto-vi-original-score-by-justice' },
    ],
  },
  {
    slug: 'gta-vi-launch-trailer-and-extended-look',
    title: 'Watch the GTA VI Launch Trailer and Extended Look',
    description: 'Rockstar’s October launch trailer joins the 26-minute PS5 showcase from August in the official GTA VI video library.',
    category: 'trailers',
    publishedAt: '2026-11-09',
    updatedAt: '2026-11-09',
    author: 'Leonida Loot Editorial',
    image: '/images/leonida/characters.webp',
    body: [
      {
        heading: 'The launch trailer',
        paragraphs: [
          'Rockstar released the launch trailer on October 15. It debuted “Flower in a Hurricane,” a track by score composers Justice featuring Tame Impala, SZA, and King Gizzard & the Lizard Wizard.',
        ],
      },
      {
        heading: 'An extended view of the game',
        paragraphs: [
          'The August 27 Extended Look runs 26 minutes and 48 seconds. Rockstar says the footage was captured in-game on PlayStation 5. The official watch page links to the full video on YouTube and Netflix.',
        ],
      },
    ],
    sources: [
      { label: 'Watch the official launch trailer', url: 'https://www.rockstargames.com/VI/launch-trailer' },
      { label: 'Watch the official Extended Look', url: 'https://www.rockstargames.com/VI/an-extended-look' },
      { label: 'Watch the official videos on Leonida Loot', url: '/about#official-videos' },
      { label: 'Rockstar Newswire Extended Look announcement', url: 'https://www.rockstargames.com/newswire/article/4k138k8okkk483/grand-theft-auto-vi-an-extended-look-now-playing' },
    ],
  },
  {
    slug: 'gta-vi-release-date-november-19-2026',
    title: 'GTA VI Release Date: November 19, 2026',
    description: 'Check the console release date, digital preload times, and Standard and Ultimate Edition details. PC timing remains unannounced.',
    category: 'release-date',
    publishedAt: '2026-07-07',
    updatedAt: '2026-11-10',
    author: 'Leonida Loot Editorial',
    image: '/og-image.png',
    body: [
      {
        heading: 'Confirmed launch information',
        paragraphs: [
          'Grand Theft Auto VI launches for PlayStation 5 and Xbox Series X|S on November 19, 2026. Rockstar lists the digital unlock at midnight local time on both consoles.',
          'Digital preload starts November 10 at local midnight on PS5 and at 00:00 UTC worldwide on Xbox Series X|S. Rockstar advises having up to 212 GB free, depending on the console.',
        ],
      },
      {
        heading: 'Preorders and editions',
        paragraphs: [
          'The US PlayStation Store lists the Standard Edition at $79.99 and the Ultimate Edition at $99.99. Digital preorder benefits include the Vintage Vice City Pack and one month of GTA+ under the store’s offer terms.',
          'Rockstar says retail editions with download codes in the box arrive November 12. Prices and offers vary by store and region.',
        ],
      },
      {
        heading: 'What is still unknown',
        paragraphs: [
          'Rockstar has yet to announce dates for PC or an online mode. GamesBeat and Bloomberg have reported possible 2027 windows, which remain unconfirmed.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games', url: 'https://www.rockstargames.com/VI' },
      { label: 'Rockstar Support regional release and preload times', url: 'https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s' },
      { label: 'Rockstar Newswire retail and storage details', url: 'https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10' },
      { label: 'PlayStation US editions and pricing', url: 'https://www.playstation.com/en-us/games/grand-theft-auto-vi/' },
      { label: 'Take-Two’s November 9 earnings release', url: gtaViLaunchSources.takeTwo },
      { label: 'PC and online reporting', url: '/news/gta-vi-pc-release-and-online-reports' },
    ],
  },
  {
    slug: 'gta-vi-leonida-map-and-vice-city-guide',
    title: 'GTA VI Leonida Map: Vice City, Keys, Wetlands and Regions',
    description: 'Explore GTA VI map clues across Leonida, including Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, and Mount Kalaga.',
    category: 'map',
    publishedAt: '2026-07-07',
    updatedAt: '2026-11-09',
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
          'The November 5 Launch Gallery adds official screenshots for comparing scenes around Vice City and Leonida. Rockstar plans to release a printable Leonida map on November 19.',
          'Until that map is available, the exact map area and regional boundaries remain unconfirmed. Community reconstructions are estimates.',
        ],
      },
    ],
    sources: [
      { label: 'Rockstar Games GTA VI', url: 'https://www.rockstargames.com/VI' },
      { label: 'Rockstar’s official Launch Gallery', url: 'https://www.rockstargames.com/VI/launch-gallery' },
      { label: 'Rockstar Newswire printable map announcement', url: 'https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10' },
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
