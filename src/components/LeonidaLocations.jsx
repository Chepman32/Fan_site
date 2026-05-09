import { useEffect, useMemo, useState } from 'react'
import { Building2, ExternalLink, Image as ImageIcon, Loader, Map, MapPin } from 'lucide-react'
import './LeonidaLocations.css'

const IGN_ORIGIN = 'https://www.ign.com'
const LEONIDA_URL = 'https://www.ign.com/wikis/gta-6/GTA_6_Leonida_Locations'
const FETCH_TIMEOUT_MS = 10000

const FALLBACK_DATA = {
  updatedAt: '2025-05-07T05:20:13Z',
  intro: [
    'Grand Theft Auto 6 is set in Vice City and expands beyond that Miami-inspired location to the state of Leonida.',
    'Leonida includes beaches, wetlands, mud bogs, counties, and six major regions revealed after the second trailer.',
  ],
  majorLocations: [
    { id: 'ambrosia', name: 'Ambrosia', url: `${IGN_ORIGIN}/wikis/gta-6/Ambrosia` },
    { id: 'grassrivers', name: 'Grassrivers', url: `${IGN_ORIGIN}/wikis/gta-6/Grassrivers` },
    { id: 'leonida-keys', name: 'Leonida Keys', url: `${IGN_ORIGIN}/wikis/gta-6/Leonida_Keys` },
    { id: 'mount-kalaga-national-park', name: 'Mount Kalaga National Park', url: `${IGN_ORIGIN}/wikis/gta-6/Mount_Kalaga_National_Park` },
    { id: 'port-gellhorn', name: 'Port Gellhorn', url: `${IGN_ORIGIN}/wikis/gta-6/Port_Gellhorn` },
    { id: 'vice-city', name: 'Vice City', url: `${IGN_ORIGIN}/wikis/gta-6/Vice_City` },
  ],
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

function stripText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function absoluteIgnUrl(url) {
  if (!url) return ''

  try {
    return new URL(url, IGN_ORIGIN).toString()
  } catch {
    return ''
  }
}

function slugify(value) {
  return stripText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
      return {
        id: slugify(name),
        name,
        url: absoluteIgnUrl(anchor?.getAttribute('href')),
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

  if (ogImage) imageUrls.set(ogImage.split('?')[0], `${ogImage}?width=1280`)

  const matches = html.match(/https:\/\/oyster\.ignimgs\.com\/mediawiki\/apis\.ign\.com\/gta-6\/[^"'\s<>)]+/g) || []
  matches.forEach((rawUrl) => {
    const imageUrl = cleanIgnImageUrl(rawUrl)
    imageUrls.set(imageUrl.split('?')[0], imageUrl)
  })

  return Array.from(imageUrls.values())
    .filter((url) => /\.(png|jpe?g|webp)(\?|$)/i.test(url))
    .slice(0, 6)
    .map((url, index) => ({
      id: slugify(url.split('/').pop()?.split('?')[0] || `image-${index + 1}`),
      title: titleFromImageUrl(url, index),
      url,
    }))
}

function parseLeonidaPage(html) {
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
    updatedAt: data.updatedAt || FALLBACK_DATA.updatedAt,
    intro: data.intro.length ? data.intro : FALLBACK_DATA.intro,
    majorLocations: data.majorLocations.length ? data.majorLocations : FALLBACK_DATA.majorLocations,
    otherLocations: data.otherLocations.length ? data.otherLocations : FALLBACK_DATA.otherLocations,
    businesses: data.businesses.length ? data.businesses : FALLBACK_DATA.businesses,
    images: data.images.length ? data.images : FALLBACK_DATA.images,
  }
}

async function fetchTextWithTimeout(url) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Leonida source failed with ${response.status}`)
    }

    return response.text()
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function formatUpdatedAt(value) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'IGN wiki'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}

function LeonidaLocations() {
  const [data, setData] = useState(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let canceled = false

    const fetchLeonidaLocations = async () => {
      try {
        setLoading(true)
        const html = await fetchTextWithTimeout(LEONIDA_URL)
        const parsedData = parseLeonidaPage(html)
        if (!canceled) {
          setData(parsedData)
          setUsingFallback(false)
        }
      } catch (error) {
        console.log('IGN Leonida fetch failed, using fallback:', error)
        if (!canceled) {
          setData(FALLBACK_DATA)
          setUsingFallback(true)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchLeonidaLocations()

    return () => {
      canceled = true
    }
  }, [])

  const locationStats = useMemo(
    () => [
      { label: 'Major regions', value: data.majorLocations.length },
      { label: 'Spotted places', value: data.otherLocations.length },
      { label: 'Businesses', value: data.businesses.length },
    ],
    [data],
  )

  return (
    <section id="leonida" className="section-padding leonida-section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Map size={14} />
            <span>IGN WIKI GUIDE</span>
          </div>
          <h2 className="section-title">
            LEONIDA <span className="gradient-text">LOCATIONS</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>Loading Leonida guide...</p>
          </div>
        )}

        {!loading && (
          <div className="leonida-content">
            <div className="leonida-overview">
              <div>
                <span className="leonida-kicker">Updated {formatUpdatedAt(data.updatedAt)}</span>
                <div className="leonida-copy">
                  {data.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {usingFallback && <p className="leonida-note">Live IGN parsing failed, showing the latest saved IGN wiki data.</p>}
              </div>

              <div className="leonida-stats">
                {locationStats.map((stat) => (
                  <div key={stat.label} className="leonida-stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="leonida-images" aria-label="IGN Leonida location images">
              {data.images.map((image) => (
                <figure key={image.id} className="leonida-image-card">
                  <img src={image.url} alt={image.title} loading="lazy" />
                  <figcaption>
                    <ImageIcon size={14} />
                    {image.title}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="major-locations-grid">
              {data.majorLocations.map((location) => (
                <a
                  key={location.id}
                  className="major-location-card"
                  href={location.url || LEONIDA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="location-marker">
                    <MapPin size={18} />
                  </span>
                  <strong>{location.name}</strong>
                  <span>
                    IGN guide
                    <ExternalLink size={13} />
                  </span>
                </a>
              ))}
            </div>

            <div className="leonida-lists">
              <article className="leonida-list-panel">
                <h3>
                  <MapPin size={18} />
                  Other spotted locations
                </h3>
                <div className="tag-list">
                  {data.otherLocations.map((location) => (
                    <span key={location}>{location}</span>
                  ))}
                </div>
              </article>

              <article className="leonida-list-panel">
                <h3>
                  <Building2 size={18} />
                  Shops and businesses
                </h3>
                <div className="tag-list">
                  {data.businesses.map((business) => (
                    <span key={business}>{business}</span>
                  ))}
                </div>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default LeonidaLocations
