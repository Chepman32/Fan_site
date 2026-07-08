export const SEO_GUIDES = [
  {
    slug: 'gta-vi-release-date',
    title: 'GTA VI Release Date: Confirmed Details and Platform Status',
    summary: 'Track the confirmed Grand Theft Auto VI launch date, announced platforms, and the details that are still unconfirmed.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Confirmed release information',
        body: 'Take-Two has announced Grand Theft Auto VI for November 19, 2026. Leonida Loot treats that date as the official planning baseline and labels anything beyond the announcement trail as rumor or speculation.',
      },
      {
        title: 'Platforms',
        body: 'The confirmed console launch targets PlayStation 5 and Xbox Series X/S. A PC version has not been formally dated, so this guide keeps PC timing separate from confirmed launch information.',
      },
      {
        title: 'What is not confirmed yet',
        body: 'Preload timing, collector editions, PC release windows, and pricing outside announced retail guidance can change. Use this page as a clean status board rather than a rumor roundup.',
      },
      {
        title: 'Related GTA VI guides',
        body: 'Pair this release-date tracker with the Leonida map guide, character hub, vehicle guide, and trailer breakdown pages for a wider view of confirmed public material.',
      },
    ],
  },
  {
    slug: 'gta-vi-trailer-breakdown',
    title: 'GTA VI Trailer Breakdown: Characters, Map Clues and Vehicles',
    summary: 'A structured GTA VI trailer breakdown covering Leonida locations, Lucia and Jason, vehicle glimpses, and official source context.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Confirmed trailer signals',
        body: 'Rockstar trailers place the story across Leonida, with Vice City, beach districts, wetlands, highways, Keys-like islands, and dense social-media moments anchoring the revealed world.',
      },
      {
        title: 'Characters shown',
        body: 'Lucia Caminos and Jason Duval are the central duo shown in the official material. Supporting figures, music-world characters, and local personalities appear throughout the footage.',
      },
      {
        title: 'Map and location clues',
        body: 'The trailer footage points to Vice City nightlife, coastal highways, rural regions, correctional facilities, wetlands, and regional towns that support the broader Leonida setting.',
      },
      {
        title: 'Vehicles and activities',
        body: 'Cars, motorcycles, boats, aircraft, service vehicles, and off-road travel all appear in public media. Leonida Loot groups those references into focused vehicle and location pages.',
      },
    ],
  },
  {
    slug: 'gta-vi-map-and-leonida',
    title: 'GTA VI Map and Leonida Guide',
    summary: 'Explore the confirmed Leonida setting, Vice City, major regions, map clues, and location pages for Grand Theft Auto VI.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Leonida as the hub',
        body: 'Leonida is the state-scale setting for Grand Theft Auto VI. It combines Vice City, coastal resorts, wetlands, Keys-like islands, industrial corridors, and rural areas.',
      },
      {
        title: 'Vice City',
        body: 'Vice City remains the strongest public location signal. Leonida Loot treats it as a primary guide hub for nightlife, hotels, beaches, downtown shots, and trailer references.',
      },
      {
        title: 'Regional pages',
        body: 'Location detail pages cover Ambrosia, Grassrivers, Leonida Keys, Mount Kalaga National Park, Port Gellhorn, and Vice City with crawlable summaries and source links.',
      },
      {
        title: 'Speculation policy',
        body: 'Map scale estimates and community interpretations are clearly separated from official public details so readers can tell confirmed information from fan analysis.',
      },
    ],
  },
  {
    slug: 'gta-vi-characters-lucia-jason',
    title: 'GTA VI Characters: Lucia, Jason and Confirmed Cast',
    summary: 'Meet Lucia, Jason, and the wider GTA VI character roster currently visible in official and source-linked public material.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Lead characters',
        body: 'Lucia Caminos and Jason Duval are the core protagonists shown across the official GTA VI reveal material. Their relationship frames much of the trailer storytelling.',
      },
      {
        title: 'Supporting cast',
        body: 'Public character references include musicians, local operators, smugglers, social personalities, and business figures connected to Vice City and greater Leonida.',
      },
      {
        title: 'Source discipline',
        body: 'Leonida Loot avoids treating anonymous leak claims as confirmed cast data. Character pages should cite official or reputable public sources when details move beyond visible trailer context.',
      },
      {
        title: 'Where to browse next',
        body: 'Use the character hub for profile cards, image references, and links into the location, vehicle, and social-media collections.',
      },
    ],
  },
  {
    slug: 'gta-vi-vehicles',
    title: 'GTA VI Vehicles: Cars, Boats, Bikes and Aircraft',
    summary: 'Browse GTA VI vehicle categories and the public media clues behind cars, motorcycles, aircraft, boats, and service vehicles.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Vehicle categories',
        body: 'The public footage points to street cars, trucks, motorcycles, aircraft, boats, emergency vehicles, and off-road options across Leonida environments.',
      },
      {
        title: 'Why vehicles matter for SEO',
        body: 'Vehicle searches are durable GTA queries. Dedicated vehicle pages help visitors move from broad trailer interest into specific collections and marketplace-ready creator assets.',
      },
      {
        title: 'Confirmed versus interpreted',
        body: 'Leonida Loot groups vehicles by visible category and source context, avoiding unsupported claims about final names, handling, garage systems, or customization depth.',
      },
      {
        title: 'Related creator assets',
        body: 'Vehicle-themed stream overlays, profile banners, and emotes can be linked from relevant guide pages when the product language stays clearly fan-made and unofficial.',
      },
    ],
  },
  {
    slug: 'gta-vi-weapons',
    title: 'GTA VI Weapons Guide: Confirmed Public References',
    summary: 'Review GTA VI weapon references from public media with a clear split between observed items, likely categories, and unconfirmed speculation.',
    updatedAt: '2026-07-07',
    sections: [
      {
        title: 'Observed weapon categories',
        body: 'Public media shows firearms and close-range weapons in trailer context, but exact final inventory systems should remain unconfirmed until Rockstar publishes details.',
      },
      {
        title: 'Guide structure',
        body: 'The weapons hub should organize items by category, visual reference, source context, and confidence level rather than treating every community guess as final.',
      },
      {
        title: 'Trust rules',
        body: 'Avoid leaked build references, datamined claims, and screenshots that cannot be attributed to public official or reputable sources.',
      },
      {
        title: 'Internal links',
        body: 'Connect weapon pages to character, trailer, location, and community discussion pages so visitors can continue exploring without relying on footer navigation.',
      },
    ],
  },
]

export const SEO_GUIDE_BY_SLUG = Object.fromEntries(
  SEO_GUIDES.map((guide) => [guide.slug, guide]),
)

export function getSeoGuide(slug) {
  return SEO_GUIDE_BY_SLUG[String(slug || '').toLowerCase()] || null
}
