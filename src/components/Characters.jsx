import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, Loader, UserRound } from 'lucide-react'
import {
  charactersTranslationSource,
  translateCharactersData,
  useTranslatedIgnContent,
} from '../i18n/ignContentTranslation'
import { characterGuideItems, characterGuideSections } from '../content/leonidaCharacters'
import { useTranslation } from '../i18n/useTranslation.jsx'
import ImageZoomModal from './ImageZoomModal'
import './Characters.css'

const IGN_ORIGIN = 'https://www.ign.com'
const CHARACTERS_URL = 'https://www.ign.com/wikis/gta-6/GTA_6_Characters'
const FETCH_TIMEOUT_MS = 10000

const FALLBACK_DATA = {
  updatedAt: '2025-05-07T00:51:37Z',
  intro: [
    'Grand Theft Auto 6 introduces Lucia Caminos and Jason Duval, the central duo shown across Rockstar trailers.',
    'IGN tracks confirmed GTA 6 cast details as Rockstar reveals more about the characters around Vice City and Leonida.',
  ],
  characters: [
    {
      id: 'lucia-caminos',
      name: 'Lucia Caminos',
      actor: 'Unknown',
      url: `${IGN_ORIGIN}/wikis/gta-6/Lucia_Caminos`,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/4/4d/Lucia-caminos-profile.png?width=960',
      imageTitle: 'Lucia Caminos profile',
      bio: 'A central protagonist whose story begins after time in Leonida Penitentiary.',
    },
    {
      id: 'jason-duval',
      name: 'Jason Duval',
      actor: 'Unknown',
      url: `${IGN_ORIGIN}/wikis/gta-6/Jason_Duval`,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/0/00/Jason-duval-profile.png?width=960',
      imageTitle: 'Jason Duval profile',
      bio: 'Lucia’s partner in crime and a former soldier tied to runners in the Leonida Keys.',
    },
    {
      id: 'boobie-ike',
      name: 'Boobie Ike',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/de/Boobie-ike-profil-img.png?width=960',
      imageTitle: 'Boobie Ike profile',
      bio: 'A Vice City real estate figure connected to the Jack of Hearts club and Only Raw Records.',
    },
    {
      id: 'brian-heder',
      name: 'Brian Heder',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/a/aa/Brian-Heder-profile.png?width=960',
      imageTitle: 'Brian Heder profile',
      bio: 'A longtime Keys smuggler with a close connection to Jason.',
    },
    {
      id: 'cal-hampton',
      name: 'Cal Hampton',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/70/Cal_Hampton_profile.png?width=960',
      imageTitle: 'Cal Hampton profile',
      bio: 'Jason’s paranoid friend and an associate of Brian.',
    },
    {
      id: 'drequan-priest',
      name: 'DreQuan Priest',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/8/87/DreQuan_Priest_profile.png?width=960',
      imageTitle: 'DreQuan Priest profile',
      bio: 'A music hustler building Only Raw Records with Boobie Ike.',
    },
    {
      id: 'raul-bautista',
      name: 'Raul Bautista',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/c/cc/Raul_Bautista_profile.png?width=960',
      imageTitle: 'Raul Bautista profile',
      bio: 'A professional robber looking for talent ready to take high-risk scores.',
    },
    {
      id: 'roxy-real-dimez',
      name: 'Roxy (Real Dimez)',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/0/04/Real_Dimez_profile-1.png?width=960',
      imageTitle: 'Roxy profile',
      bio: 'One half of Real Dimez, the viral duo signed to Only Raw Records.',
    },
    {
      id: 'bae-luxe-real-dimez',
      name: 'Bae-Luxe (Real Dimez)',
      actor: 'Unknown',
      url: CHARACTERS_URL,
      imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/a/af/Real_Dimez_profile-2.png?width=960',
      imageTitle: 'Bae-Luxe profile',
      bio: 'One half of Real Dimez, the viral duo signed to Only Raw Records.',
    },
  ],
}

function stripText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function textWithBreaks(element) {
  if (!element) return ''
  const clone = element.cloneNode(true)
  clone.querySelectorAll('br').forEach((breakNode) => breakNode.replaceWith(' '))
  return stripText(clone.textContent)
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

function fileKey(value = '') {
  const filename = decodeURIComponent(String(value).split('/').pop()?.split('?')[0] || value)
  return filename.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function cleanBio(value = '') {
  return stripText(value)
    .replace(/From the official GTA 6 site:/gi, 'Official GTA 6 bio:')
    .replace(/From the GTA 6 site:/gi, 'Official GTA 6 bio:')
    .replace(/([.!?])(?=[A-Z])/g, '$1 ')
}

function cleanIgnImageUrl(value) {
  const cleaned = value
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/[\\),;]+$/g, '')

  const base = cleaned.split('?')[0]
  return `${base}?width=960`
}

function readCharacterImageMap(html, document) {
  const images = new Map()
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')

  if (ogImage) {
    const cleanUrl = cleanIgnImageUrl(ogImage)
    images.set(fileKey(cleanUrl), cleanUrl)
  }

  const matches = html.match(/https:\/\/oyster\.ignimgs\.com\/mediawiki\/apis\.ign\.com\/gta-6\/[^"'\s<>)]+/g) || []
  matches.forEach((rawUrl) => {
    const imageUrl = cleanIgnImageUrl(rawUrl)
    if (!/\.(png|jpe?g|webp)(\?|$)/i.test(imageUrl)) return

    images.set(fileKey(imageUrl), imageUrl)
  })

  return images
}

function parseCharacterRows(document, imageMap) {
  const table = Array.from(document.querySelectorAll('.wiki-page table')).find((candidate) => {
    const headerText = stripText(candidate.querySelector('tr')?.textContent)
    return headerText.includes('Character') && headerText.includes('Bio')
  })

  if (!table) return []

  const characters = []
  let sharedBio = ''

  Array.from(table.querySelectorAll('tr')).forEach((row) => {
    if (row.querySelector('th')) return

    const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TD')
    if (cells.length < 2) return

    const nameCell = cells[0]
    const name = textWithBreaks(nameCell.querySelector('p') || nameCell)
    const actor = stripText(cells[1]?.textContent) || 'Unknown'
    const bioCell = cells[2]
    const bio = bioCell ? cleanBio(textWithBreaks(bioCell)) : sharedBio
    const anchor = nameCell.querySelector('a[href]')
    const imageAlt = nameCell.querySelector('img')?.getAttribute('alt') || ''
    const imageUrl = imageMap.get(fileKey(imageAlt)) || ''

    if (bioCell?.getAttribute('rowspan')) {
      sharedBio = bio
    }

    if (!name || !bio) return

    characters.push({
      id: slugify(name),
      name,
      actor,
      bio,
      imageUrl,
      imageTitle: imageAlt ? stripText(imageAlt.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')) : `${name} profile`,
      url: absoluteIgnUrl(anchor?.getAttribute('href')) || CHARACTERS_URL,
    })
  })

  return characters
}

function parseCharactersPage(html) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const imageMap = readCharacterImageMap(html, document)
  const intro = Array.from(document.querySelectorAll('.wiki-page .wiki-section.wiki-html p'))
    .map((paragraph) => textWithBreaks(paragraph))
    .filter((text) => text && !text.includes('Character Actress/Actor Bio'))
    .slice(0, 2)

  const data = {
    updatedAt: document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || '',
    intro,
    characters: parseCharacterRows(document, imageMap),
  }

  return {
    updatedAt: data.updatedAt || FALLBACK_DATA.updatedAt,
    intro: data.intro.length ? data.intro : FALLBACK_DATA.intro,
    characters: data.characters.length ? data.characters : FALLBACK_DATA.characters,
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
      throw new Error(`Characters source failed with ${response.status}`)
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

function CharacterCard({ character, featured = false, index = 0, onZoom }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={featured ? 'ign-character-card featured-character' : 'ign-character-card'}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => onZoom(character)}
    >
      <div className="ign-character-image">
        {character.imageUrl ? (
          <img src={character.imageUrl} alt={character.imageTitle || `${character.name} profile`} loading="lazy" decoding="async" />
        ) : (
          <span>
            <ImageIcon size={24} />
          </span>
        )}
      </div>
      <div className="ign-character-body">
        <span className="character-source">
          <UserRound size={13} />
          {character.actor && character.actor !== 'Unknown' ? character.actor : t.characters.actorUnknown}
        </span>
        <h3>{character.name}</h3>
        <p>{character.bio}</p>
      </div>
    </button>
  )
}

function Characters() {
  const { t, lang } = useTranslation()
  const [data, setData] = useState(FALLBACK_DATA)
  const [loading, setLoading] = useState(false)
  const [zoomed, setZoomed] = useState(null)

  useEffect(() => {
    let canceled = false

    const fetchCharacters = async () => {
      try {
        const html = await fetchTextWithTimeout(CHARACTERS_URL)
        const parsedData = parseCharactersPage(html)
        if (!canceled) {
          setData(parsedData)
        }
      } catch (error) {
        console.log('IGN characters fetch failed, using fallback:', error)
        if (!canceled) {
          setData(FALLBACK_DATA)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchCharacters()

    return () => {
      canceled = true
    }
  }, [])

  const translationSource = useMemo(() => charactersTranslationSource(data), [data])
  const { data: displayData } = useTranslatedIgnContent(data, {
    enabled: !loading,
    lang,
    scope: 'characters',
    source: translationSource,
    translate: translateCharactersData,
  })

  const stats = useMemo(
    () => [
      { label: t.characters.stats.characters, value: displayData.characters.length },
      { label: t.characters.stats.profileImages, value: displayData.characters.filter((character) => character.imageUrl).length },
      { label: t.characters.stats.leadDuo, value: displayData.characters.slice(0, 2).length },
    ],
    [displayData.characters, t],
  )

  const featuredCharacters = displayData.characters.slice(0, 2)
  const supportingCharacters = displayData.characters.slice(2)

  return (
    <section id="characters" className="section-padding characters">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {t.characters.title} <span className="gradient-text">{t.characters.titleHighlight}</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{t.characters.loading}</p>
          </div>
        )}

        {!loading && (
          <div className="ign-characters-content">
            <div className="characters-overview">
              <div>
                <span className="characters-kicker">{t.characters.updatedOn} {formatUpdatedAt(data.updatedAt)}</span>
                <div className="characters-copy">
                  {displayData.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="characters-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="characters-stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="featured-characters-grid">
              {featuredCharacters.map((character, index) => (
                <CharacterCard key={character.id} character={character} featured index={index} onZoom={setZoomed} />
              ))}
            </div>

            <div className="characters-grid">
              {supportingCharacters.map((character, index) => (
                <CharacterCard key={character.id} character={character} index={index + featuredCharacters.length} onZoom={setZoomed} />
              ))}
            </div>

            <div className="character-static-guide" aria-label="GTA VI character guide">
              <div className="character-guide-intro">
                <h3>GTA VI character guide</h3>
                <p>
                  The Leonida cast guide keeps official and reputable public character coverage
                  separate from rumor-only claims, with role, status, description, and source
                  labels for every major named character.
                </p>
              </div>
              <div className="character-guide-grid">
                {characterGuideItems.map((character) => (
                  <article key={character.name}>
                    <span>{character.status}</span>
                    <h3>{character.name}</h3>
                    <strong>{character.role}</strong>
                    <p>{character.description}</p>
                    {character.sourceUrl && (
                      <a href={character.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {character.sourceLabel || 'Source'}
                      </a>
                    )}
                  </article>
                ))}
              </div>
              <div className="character-guide-notes">
                {characterGuideSections.map((section) => (
                  <article key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {zoomed && (
        <ImageZoomModal
          src={zoomed.imageUrl}
          alt={zoomed.imageTitle || zoomed.name}
          onClose={() => setZoomed(null)}
        />
      )}
    </section>
  )
}

export default Characters
