const IGN_ORIGIN = 'https://www.ign.com'
const FETCH_TIMEOUT_MS = 10000

export const LEONIDA_URL = `${IGN_ORIGIN}/wikis/gta-6/GTA_6_Leonida_Locations`

export const LOCATION_GUIDES = [
  {
    id: 'ambrosia',
    name: 'Ambrosia',
    ignPath: '/wikis/gta-6/Ambrosia',
    fallbackSummary: 'Ambrosia is one of the six major Leonida locations revealed for Grand Theft Auto 6.',
  },
  {
    id: 'grassrivers',
    name: 'Grassrivers',
    ignPath: '/wikis/gta-6/Grassrivers',
    fallbackSummary: 'Grassrivers covers Leonida wetlands, backroads, and wildlife-heavy territory.',
  },
  {
    id: 'leonida-keys',
    name: 'Leonida Keys',
    ignPath: '/wikis/gta-6/Leonida_Keys',
    fallbackSummary: 'Leonida Keys is the island chain region south of the Vice City sprawl.',
  },
  {
    id: 'mount-kalaga-national-park',
    name: 'Mount Kalaga National Park',
    ignPath: '/wikis/gta-6/Mount_Kalaga_National_Park',
    fallbackSummary: 'Mount Kalaga National Park is Leonida wilderness with forests, trails, and rural roads.',
  },
  {
    id: 'port-gellhorn',
    name: 'Port Gellhorn',
    ignPath: '/wikis/gta-6/Port_Gellhorn',
    fallbackSummary: 'Port Gellhorn is an older Leonida town of motels, shut-down attractions, and active crime.',
  },
  {
    id: 'vice-city',
    name: 'Vice City',
    ignPath: '/wikis/gta-6/Vice_City',
    fallbackSummary: 'Vice City is the neon-lit urban center of GTA 6 and the heart of Leonida.',
  },
].map((guide) => ({
  ...guide,
  url: `${IGN_ORIGIN}${guide.ignPath}`,
  path: `/locations/${guide.id}`,
}))

export const FALLBACK_LEONIDA_DATA = {
  updatedAt: '2025-05-07T05:20:13Z',
  intro: [
    'Grand Theft Auto 6 is set in Vice City and expands beyond that Miami-inspired location to the state of Leonida.',
    'Leonida includes beaches, wetlands, mud bogs, counties, and six major regions revealed after the second trailer.',
  ],
  majorLocations: LOCATION_GUIDES.map(({ id, name, path, url }) => ({ id, name, path, url })),
  otherLocations: [
    'Port Vice City',
    'Keys',
    'Vice Beaches',
    'Hamlet',
    'Waning Sands',
    'Vice City International Airport',
    'Stockyard (near downtown)',
    'Vice City Downtown',
  ],
  businesses: [
    'Pawn and Gun',
    "Uncle Jack's Liquor",
    'Rideout Customs',
    'Jack of Hearts Club',
    'Ammu-Nation',
    "Chip's Body Shop",
    'The Rusty Anchor',
    'Starlet Motel',
    'Delights Cabaret',
    'Ocean View Hotel',
    'Sahara Arena',
  ],
  images: [
    {
      id: 'vlcsnap-2023-12-04-18h59m30s080-png',
      title: 'Vice City trailer frame',
      url: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/4/42/Vlcsnap-2023-12-04-18h59m30s080.png?width=1280',
    },
    {
      id: 'ign-gta-vice-city-map-jpg',
      title: 'GTA: Vice City reference map',
      url: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/52/Ign-gta-vice-city-map.JPG?width=1280',
    },
    {
      id: 'gta-6-vice-city-comparison-jpg',
      title: 'Vice City comparison',
      url: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/6/6e/Gta-6-vice-city-comparison.jpg?width=1280',
    },
  ],
}

export function stripText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function slugify(value) {
  return stripText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function absoluteIgnUrl(url) {
  if (!url) return ''

  try {
    return new URL(url, IGN_ORIGIN).toString()
  } catch {
    return ''
  }
}

export function getLocationGuideBySlug(slug) {
  return LOCATION_GUIDES.find((guide) => guide.id === slug) || null
}

export function getLocationGuideByIgnUrl(url) {
  const absoluteUrl = absoluteIgnUrl(url)
  if (!absoluteUrl) return null

  try {
    const pathname = new URL(absoluteUrl).pathname.toLowerCase()
    return LOCATION_GUIDES.find((guide) => guide.ignPath.toLowerCase() === pathname) || null
  } catch {
    return null
  }
}

export function locationPathFromIgnUrl(url) {
  return getLocationGuideByIgnUrl(url)?.path || ''
}

function readItemsFromList(section) {
  return Array.from(section?.querySelectorAll('li') || [])
    .map((item) => stripText(item.textContent))
    .filter(Boolean)
}

function readLinkedItemsFromList(section) {
  return Array.from(section?.querySelectorAll('li') || [])
    .map((item) => {
      const anchor = item.querySelector('a[href]')
      const name = stripText(anchor?.textContent || item.textContent)
      const url = absoluteIgnUrl(anchor?.getAttribute('href'))
      const knownGuide = getLocationGuideByIgnUrl(url)

      return {
        id: knownGuide?.id || slugify(name),
        name,
        path: knownGuide?.path || '',
        url,
      }
    })
    .filter((item) => item.name)
}

function findListAfter(sections, matcher) {
  const triggerIndex = sections.findIndex((section) => matcher(stripText(section.textContent)))
  if (triggerIndex === -1) return null
  return sections.slice(triggerIndex + 1).find((section) => section.querySelector('li')) || null
}

function titleFromImageUrl(url, index) {
  const filename = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `IGN image ${index + 1}`)
  const knownTitles = {
    'Vlcsnap-2023-12-04-18h59m30s080.png': 'Vice City trailer frame',
    'Ign-gta-vice-city-map.JPG': 'GTA: Vice City reference map',
    'Gta-6-vice-city-comparison.jpg': 'Vice City comparison',
  }

  if (knownTitles[filename]) return knownTitles[filename]

  return filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function cleanIgnImageUrl(value) {
  const cleaned = value
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/[\\),;]+$/g, '')

  const base = cleaned.split('?')[0]
  return `${base}?width=1280`
}

function readIgnImages(html, document) {
  const imageUrls = new Map()
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')

  if (ogImage) {
    const imageUrl = cleanIgnImageUrl(ogImage)
    imageUrls.set(imageUrl.split('?')[0], imageUrl)
  }

  const matches = html.match(/https:\/\/oyster\.ignimgs\.com\/mediawiki\/apis\.ign\.com\/gta-6\/[^"'\s<>)]+/g) || []
  matches.forEach((rawUrl) => {
    const imageUrl = cleanIgnImageUrl(rawUrl)
    imageUrls.set(imageUrl.split('?')[0], imageUrl)
  })

  return Array.from(imageUrls.values())
    .filter((url) => /\.(png|jpe?g|webp)(\?|$)/i.test(url))
    .slice(0, 8)
    .map((url, index) => ({
      id: slugify(url.split('/').pop()?.split('?')[0] || `image-${index + 1}`),
      title: titleFromImageUrl(url, index),
      url,
    }))
}

function cleanIgnTitle(value, fallback = '') {
  return stripText(value)
    .replace(/\s+-\s+GTA\s*6\s+Guide\s+-\s+IGN$/i, '')
    .replace(/\s+-\s+IGN$/i, '')
    || fallback
}

function getMetaContent(document, selector) {
  return stripText(document.querySelector(selector)?.getAttribute('content'))
}

function uniqueLinks(links) {
  const seen = new Set()

  return links.filter((link) => {
    const key = link.path || link.url || link.name
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function readParagraphs(section) {
  return Array.from(section?.querySelectorAll('p') || [])
    .map((paragraph) => stripText(paragraph.textContent))
    .filter((text) => text && text.length > 1)
}

export function parseLeonidaPage(html) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const sections = Array.from(document.querySelectorAll('.wiki-page .wiki-section.wiki-html'))
  const paragraphs = Array.from(document.querySelectorAll('.wiki-page .wiki-section.wiki-html p'))
    .map((paragraph) => stripText(paragraph.textContent))
    .filter((text) => text && !text.startsWith('Below are') && !text.includes('shown on signs'))

  const majorList = findListAfter(sections, (text) => text.includes('Six major locations have been revealed'))
  const otherList = findListAfter(sections, (text) => text.includes('Below are other locations'))
  const businessList = findListAfter(sections, (text) => text.includes('Below are all spotted shops and businesses'))

  const data = {
    updatedAt: document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || '',
    intro: paragraphs.slice(0, 2),
    majorLocations: readLinkedItemsFromList(majorList),
    otherLocations: readItemsFromList(otherList),
    businesses: readItemsFromList(businessList),
    images: readIgnImages(html, document),
  }

  return {
    updatedAt: data.updatedAt || FALLBACK_LEONIDA_DATA.updatedAt,
    intro: data.intro.length ? data.intro : FALLBACK_LEONIDA_DATA.intro,
    majorLocations: data.majorLocations.length ? data.majorLocations : FALLBACK_LEONIDA_DATA.majorLocations,
    otherLocations: data.otherLocations.length ? data.otherLocations : FALLBACK_LEONIDA_DATA.otherLocations,
    businesses: data.businesses.length ? data.businesses : FALLBACK_LEONIDA_DATA.businesses,
    images: data.images.length ? data.images : FALLBACK_LEONIDA_DATA.images,
  }
}

export function createFallbackLocationPage(guide) {
  return {
    id: guide.id,
    title: guide.name,
    sourceUrl: guide.url,
    updatedAt: '',
    description: guide.fallbackSummary,
    intro: [guide.fallbackSummary],
    sections: [],
    relatedLinks: LOCATION_GUIDES
      .filter((location) => location.id !== guide.id)
      .map(({ id, name, path, url }) => ({ id, name, path, url })),
    images: [],
  }
}

export function parseLocationGuidePage(html, guide) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const sourceUrl = getMetaContent(document, 'meta[property="og:url"]') || guide.url
  const title = cleanIgnTitle(
    getMetaContent(document, 'meta[property="og:title"]') || stripText(document.querySelector('h1')?.textContent),
    guide.name,
  )
  const description = getMetaContent(document, 'meta[name="description"]') || guide.fallbackSummary
  const updatedAt = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || ''
  const wikiSections = Array.from(document.querySelectorAll('.wiki-page .wiki-section.wiki-html'))
  const intro = []
  const sections = []
  let currentSection = null

  wikiSections.forEach((section) => {
    const heading = stripText(section.querySelector('h2 .mw-headline, h2, h3')?.textContent)
    const paragraphs = readParagraphs(section)
    const linkedItems = readLinkedItemsFromList(section)

    if (heading) {
      currentSection = {
        id: slugify(heading),
        title: heading,
        paragraphs: [],
        links: [],
      }
      sections.push(currentSection)
      return
    }

    if (!currentSection) {
      intro.push(...paragraphs)
      return
    }

    currentSection.paragraphs.push(...paragraphs)
    currentSection.links.push(...linkedItems)
  })

  const meaningfulSections = sections
    .map((section) => ({
      ...section,
      links: uniqueLinks(section.links),
    }))
    .filter((section) => section.paragraphs.length || section.links.length)

  const relatedLinks = uniqueLinks(
    meaningfulSections.flatMap((section) => section.links).filter((link) => link.path),
  ).filter((link) => link.path !== guide.path)

  return {
    id: guide.id,
    title,
    sourceUrl,
    updatedAt,
    description,
    intro: intro.length ? intro : [description].filter(Boolean),
    sections: meaningfulSections,
    relatedLinks: relatedLinks.length
      ? relatedLinks
      : LOCATION_GUIDES
        .filter((location) => location.id !== guide.id)
        .map(({ id, name, path, url }) => ({ id, name, path, url })),
    images: readIgnImages(html, document),
  }
}

export async function fetchTextWithTimeout(url) {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      throw new Error(`IGN source failed with ${response.status}`)
    }

    return response.text()
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export function formatUpdatedAt(value) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'IGN wiki'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}
