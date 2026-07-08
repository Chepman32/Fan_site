import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bike,
  Car,
  Crosshair,
  ExternalLink,
  Image as ImageIcon,
  Loader,
  Plane,
  Radio,
  Ship,
  Tag,
} from 'lucide-react'
import {
  guideTranslationSource,
  translateGuideData,
  translateVehiclesData,
  useTranslatedIgnContent,
  vehiclesTranslationSource,
} from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import ImageZoomModal from './ImageZoomModal'
import './IgnGuide.css'

const IGN_ORIGIN = 'https://www.ign.com'
const FETCH_TIMEOUT_MS = 10000

const GUIDE_URLS = {
  weapons: 'https://www.ign.com/wikis/gta-6/Weapons_List',
  socialMedia: 'https://www.ign.com/wikis/gta-6/Social_Media_in_GTA_6',
  vehicles: 'https://www.ign.com/wikis/gta-6/GTA_6_Vehicles_List',
  cars: 'https://www.ign.com/wikis/gta-6/Cars_List',
  motorcycles: 'https://www.ign.com/wikis/gta-6/Bikes_and_Motorcycles_List',
  aircrafts: 'https://www.ign.com/wikis/gta-6/Aircrafts_List',
  boats: 'https://www.ign.com/wikis/gta-6/Watercraft_and_Boats_List',
}

const DEFAULT_COPY = {
  weapons: {
    badge: 'IGN WIKI GUIDE',
    title: 'GTA 6',
    titleHighlight: 'WEAPONS',
    loading: 'Preparing weapons guide',
    updatedOn: 'Updated',
    fallbackNote: 'Live IGN parsing failed, showing the latest saved IGN wiki data.',
    ignGuide: 'IGN guide',
    itemsLabel: 'items',
    sourceLabel: 'Spotted weapon',
    mediaLabel: 'Additional IGN images',
    stats: {
      items: 'Weapons',
      images: 'Images',
      groups: 'Groups',
    },
  },
  socialMedia: {
    badge: 'IGN WIKI GUIDE',
    title: 'GTA 6',
    titleHighlight: 'SOCIAL MEDIA',
    loading: 'Preparing social media guide',
    updatedOn: 'Updated',
    fallbackNote: 'Live IGN parsing failed, showing the latest saved IGN wiki data.',
    ignGuide: 'IGN guide',
    itemsLabel: 'accounts',
    sourceLabel: 'Trailer account',
    mediaLabel: 'Other media captures',
    stats: {
      items: 'Accounts',
      images: 'Images',
      groups: 'Groups',
    },
  },
  vehicles: {
    badge: 'IGN WIKI GUIDE',
    title: 'GTA 6',
    titleHighlight: 'VEHICLES',
    loading: 'Preparing vehicle guide',
    updatedOn: 'Updated',
    fallbackNote: 'Live IGN parsing failed, showing the latest saved IGN wiki data.',
    ignGuide: 'Open IGN subpage',
    itemsLabel: 'vehicles',
    sourceLabel: 'Vehicle type',
    mediaLabel: 'Overview images',
    subpageLabel: 'Vehicle subpage',
    stats: {
      categories: 'Subpages',
      vehicles: 'Vehicles',
      images: 'Images',
    },
    tabs: {
      cars: 'Cars',
      motorcycles: 'Motorcycles',
      aircrafts: 'Aircrafts',
      boats: 'Boats',
    },
  },
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
  const filename = String(value).split('/').pop()?.split('?')[0] || value

  try {
    return decodeURIComponent(filename).toLowerCase().replace(/[^a-z0-9]/g, '')
  } catch {
    return filename.toLowerCase().replace(/[^a-z0-9]/g, '')
  }
}

function cleanItemName(value = '') {
  return stripText(value).replace(/^['`]\s*/, '')
}

function cleanIgnImageUrl(value, width = 960) {
  const cleaned = String(value)
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/[\\),;]+$/g, '')

  return `${cleaned.split('?')[0]}?width=${width}`
}

function titleFromImageName(value = '', fallback = 'IGN image') {
  const filename = decodeURIComponent(String(value).split('/').pop()?.split('?')[0] || fallback)

  return filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function readIgnImageAssets(html, document, width = 960) {
  const imageUrls = new Map()
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')

  if (ogImage) {
    const cleanUrl = cleanIgnImageUrl(ogImage, width)
    imageUrls.set(cleanUrl.split('?')[0], cleanUrl)
  }

  const matches = html.match(/https:\/\/oyster\.ignimgs\.com\/mediawiki\/apis\.ign\.com\/gta-6\/[^"'\s<>)]+/g) || []
  matches.forEach((rawUrl) => {
    const imageUrl = cleanIgnImageUrl(rawUrl, width)
    if (!/\.(png|jpe?g|webp)(\?|$)/i.test(imageUrl)) return

    imageUrls.set(imageUrl.split('?')[0], imageUrl)
  })

  return Array.from(imageUrls.values()).map((url, index) => ({
    id: slugify(url.split('/').pop()?.split('?')[0] || `image-${index + 1}`),
    title: titleFromImageName(url, `IGN image ${index + 1}`),
    url,
  }))
}

function parseIntro(document, limit = 2) {
  return Array.from(document.querySelectorAll('.wiki-page .wiki-section.wiki-html p'))
    .map((paragraph) => textWithBreaks(paragraph))
    .filter(Boolean)
    .slice(0, limit)
}

function parseGuideCollections(document, imageMap, sourceUrl) {
  return Array.from(document.querySelectorAll('.wiki-page table'))
    .map((table) => {
      const rows = Array.from(table.querySelectorAll('tr'))
      const title = stripText(rows[0]?.querySelector('th')?.textContent || rows[0]?.textContent) || 'IGN list'
      const items = rows
        .filter((row) => !row.querySelector('th'))
        .map((row) => {
          const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TD')
          if (cells.length < 2) return null

          const nameCell = cells[0]
          const description = textWithBreaks(cells[1])
          const imageAlt = nameCell.querySelector('img')?.getAttribute('alt') || ''
          const name = cleanItemName(textWithBreaks(nameCell.querySelector('p') || nameCell))
          const anchor = nameCell.querySelector('a[href]')
          const imageUrl = imageMap.get(fileKey(imageAlt)) || ''

          if (!name || !description) return null

          return {
            id: slugify(name),
            name,
            description,
            imageUrl,
            imageTitle: imageAlt ? titleFromImageName(imageAlt, name) : name,
            url: absoluteIgnUrl(anchor?.getAttribute('href')) || sourceUrl,
          }
        })
        .filter(Boolean)

      if (!items.length) return null

      return {
        id: slugify(title),
        title,
        items,
      }
    })
    .filter(Boolean)
}

function parseGuidePage(html, sourceUrl, fallback) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const imageAssets = readIgnImageAssets(html, document)
  const imageMap = new Map(imageAssets.map((image) => [fileKey(image.url), image.url]))
  const collections = parseGuideCollections(document, imageMap, sourceUrl)
  const usedImages = new Set(collections.flatMap((collection) => collection.items.map((item) => item.imageUrl).filter(Boolean)))
  const extraImages = imageAssets.filter((image) => !usedImages.has(image.url)).slice(0, 3)

  return {
    updatedAt: document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || fallback.updatedAt,
    intro: parseIntro(document).length ? parseIntro(document) : fallback.intro,
    collections: collections.length ? collections : fallback.collections,
    extraImages: extraImages.length ? extraImages : fallback.extraImages,
  }
}

function parseVehicleOverviewPage(html, fallback) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const images = readIgnImageAssets(html, document).slice(0, 3)

  return {
    updatedAt: document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') || fallback.updatedAt,
    intro: parseIntro(document).length ? parseIntro(document) : fallback.intro,
    images: images.length ? images : fallback.images,
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
      throw new Error(`IGN source failed with ${response.status}`)
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

function imageAsset(title, url) {
  return {
    id: slugify(title),
    title,
    url,
  }
}

function guideCopy(t, key) {
  const fallback = DEFAULT_COPY[key]
  const local = t.guides?.[key] || t[key] || {}

  return {
    ...fallback,
    ...local,
    stats: {
      ...fallback.stats,
      ...(local.stats || {}),
    },
    tabs: {
      ...(fallback.tabs || {}),
      ...(local.tabs || {}),
    },
    collectionTitles: {
      ...(fallback.collectionTitles || {}),
      ...(local.collectionTitles || {}),
    },
  }
}

function translatedCollectionTitle(copy, collection) {
  return copy.collectionTitles?.[collection.id] || collection.title
}

const WEAPONS_FALLBACK = {
  updatedAt: '2025-05-09T03:13:39Z',
  intro: [
    "Rockstar has yet to officially confirm any of GTA 6's weapons; however, several firearms and melee weapons have been spotted in the two trailers and accompanying screenshots.",
    "Below are all the weapons IGN has spotted in the trailers and screenshots. The wiki page is expected to update as more weapons are revealed.",
  ],
  collections: [
    {
      id: 'weapons-list',
      title: 'Weapons List',
      items: [
        {
          id: 'revolver-357-magnum',
          name: 'Revolver (.357 Magnum)',
          description: 'This high-powered handgun shows up in the screenshots on the promotional site.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/f/fe/.357_Magnum.jpg?width=960',
          imageTitle: '.357 Magnum',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'pistol-9mm',
          name: 'Pistol (9mm)',
          description: 'Several 9mm pistols appear throughout the trailers, including ones resembling a Beretta M9 and a SIG Sauer variant.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/7c/9mm_2.jpg?width=960',
          imageTitle: '9mm 2',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'pistol-9mm-variant',
          name: 'Pistol (9mm Variant)',
          description: "A Capo-made 9mm type appears in one of Rockstar's screenshots.",
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/4/43/Capo_Pistol.jpg?width=960',
          imageTitle: 'Capo Pistol',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'assault-rifle-ar-15',
          name: 'Assault Rifle (AR-15)',
          description: "The AR-15 is visible across trailers and screenshots, making it one of the clearest firearm spots so far.",
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/e/ee/AR-15_1.jpg?width=960',
          imageTitle: 'AR 15 1',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'bolt-action-rifle-remington-model-700',
          name: 'Bolt-Action Rifle (Remington Model 700)',
          description: 'A hunting screenshot shows a bolt-action rifle that appears to be based on the Remington Model 700.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/10/Remington_Model_700.jpg?width=960',
          imageTitle: 'Remington Model 700',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'grenade-launcher',
          name: 'Grenade Launcher',
          description: 'Lucia appears to use a grenade launcher during a short explosive moment in trailer footage.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/50/Grenade_Launcher.jpg?width=960',
          imageTitle: 'Grenade Launcher',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'smg-mp5',
          name: 'SMG (MP5)',
          description: 'Lucia and Jason use MP5-like SMGs during the heist scene in trailer 2.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/2/2f/SMP.jpg?width=960',
          imageTitle: 'SMP',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'semi-auto-rifle-m14',
          name: 'Semi-Auto Rifle (M14)',
          description: 'The M14 appears in a shot featuring hunters on an airboat.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/d9/M14.jpg?width=960',
          imageTitle: 'M14',
          url: GUIDE_URLS.weapons,
        },
        {
          id: 'golf-club',
          name: 'Golf Club',
          description: "Cal is shown with a minigolf club, which IGN flags as a likely melee weapon candidate.",
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/e/e9/Golf_Club.jpg?width=960',
          imageTitle: 'Golf Club',
          url: GUIDE_URLS.weapons,
        },
      ],
    },
  ],
  extraImages: [
    imageAsset('Ammu-Nation weapon display', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/0/0b/PS5_Reference_in_GTA_6.png?width=960'),
  ],
}

const SOCIAL_MEDIA_FALLBACK = {
  updatedAt: '2023-12-05T07:55:04Z',
  intro: [
    "With GTA 6's modern setting, social media coming into play in some fashion just makes sense.",
    "The accounts below appear in GTA 6's first trailer. Some accounts did not include social media icons.",
  ],
  collections: [
    {
      id: 'accounts',
      title: 'Accounts',
      items: [
        {
          id: 'dadbodsquad',
          name: 'DadBodSquad',
          description: 'Either an account for fans of dad bods or an account documenting a person with a dad bod and their fans.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/da/Gta-6-dadbodsquad.png?width=960',
          imageTitle: 'GTA 6 DadBodSquad',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'officialpoach',
          name: 'OfficialPOACH',
          description: "POACH is the acronym for Protection of Animals and Controlled Huntings. Their account showed an alligator being wrangled out of someone's pool.",
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/7a/Gta-6-official-poach.png?width=960',
          imageTitle: 'GTA 6 Official POACH',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'have-a-vice-day',
          name: 'have.a.vice.day',
          description: 'This could be an account collecting videos of happenings across Vice City specifically.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/73/Gta6-haveaviceday.png?width=960',
          imageTitle: 'have.a.vice.day',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'planetleonidaman',
          name: 'PlanetLeonidaMan',
          description: 'A potential collector of odd encounters unique to Leonida and a play on the real-life Florida Man meme.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/c/c3/Gta-6-planetleonidaman.png?width=960',
          imageTitle: 'PlanetLeonidaMan',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'generalcustardcannon',
          name: 'GeneralCustardCannon',
          description: 'Seemingly a personal account with a trailer caption about bad driving in Leonida.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/3/3c/Gta-6-generalcustardcannon.png?width=960',
          imageTitle: 'GeneralCustardCannon',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'yomammazjammer',
          name: 'YoMammazJammer',
          description: 'Seemingly a personal account shown with a memorial caption in trailer 1.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/53/Gta6-yomammazjammer.png?width=960',
          imageTitle: 'YoMammazJammer',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'luchalibrefan',
          name: 'LuchaLibreFan',
          description: 'Seemingly a personal account with a neighborhood watch caption from Hamlet.',
          imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/1e/Gta-6-luchalibrefan.png?width=960',
          imageTitle: 'LuchaLibreFan',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'mega-mundonews',
          name: 'Mega_MundoNews',
          description: 'The account for the Spanish news station.',
          imageUrl: '',
          imageTitle: 'Mega_MundoNews',
          url: GUIDE_URLS.socialMedia,
        },
        {
          id: 'highrollerzmag',
          name: 'HighRollerzMag',
          description: 'The account for High Rollerz Lifestyle magazine.',
          imageUrl: '',
          imageTitle: 'HighRollerzMag',
          url: GUIDE_URLS.socialMedia,
        },
      ],
    },
  ],
  extraImages: [
    imageAsset('Trailer social feed capture', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/3/3a/Grand_Theft_Auto_VI_Trailer_1_0-42_screenshot.png?width=960'),
    imageAsset('Other media capture', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/f/fc/Grand_Theft_Auto_VI_Trailer_1_0-56_screenshot.png?width=960'),
  ],
}

const VEHICLE_CATEGORY_FALLBACKS = {
  cars: {
    id: 'cars',
    updatedAt: '2025-05-08T02:11:53Z',
    intro: [
      'Rockstar has yet to officially confirm any cars for GTA 6; however, trailers and screenshots gave IGN several looks at returning and new models.',
      "Below are cars IGN has spotted so far, grouped by vehicle type.",
    ],
    collections: [
      {
        id: 'muscle-cars',
        title: 'Muscle Cars',
        items: [
          {
            id: 'buccaneer',
            name: 'Buccaneer',
            description: 'A classic two-door lowrider with a fancy paint job in trailer 1.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/c/c2/Buccaneer.jpg?width=960',
            imageTitle: 'Buccaneer',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'dominator',
            name: 'Dominator',
            description: 'This muscle car is based on the 2000 Ford Mustang SVT Cobra R and has several variants in GTA Online.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/52/Dominator.jpg?width=960',
            imageTitle: 'Dominator',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'gauntlet-hellfire',
            name: 'Gauntlet Hellfire',
            description: 'The two-door coupe is largely based on the Dodge Challenger Hellcat line.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/c/c4/Gauntlet_Hellfire.jpg?width=960',
            imageTitle: 'Gauntlet Hellfire',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'phoenix',
            name: 'Phoenix',
            description: "Imponte's Phoenix is based on the Pontiac Firebird/Trans Am and appears several times in trailer 2.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/a/ac/Phoenix.jpg?width=960',
            imageTitle: 'Phoenix',
            url: GUIDE_URLS.cars,
          },
        ],
      },
      {
        id: 'sports-cars',
        title: 'Sports Cars',
        items: [
          {
            id: 'banshee',
            name: 'Banshee',
            description: 'The Banshee is an iconic GTA car that dates back to GTA 3.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/d3/Banshee.png?width=960',
            imageTitle: 'Banshee',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'buffalo',
            name: 'Buffalo',
            description: "The Buffalo briefly pops up in trailer 1 and combines a sixth-generation Dodge Charger with a '07 Shelby GT500.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/3/33/Buffalo.jpg?width=960',
            imageTitle: 'Buffalo',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'carbonizzare',
            name: 'Carbonizzare',
            description: 'This car is heavily based on the Aston Martin V12 Zagato.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/9/94/Gta-6-Carbonizzare.png?width=960',
            imageTitle: 'Carbonizzare',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'coquette',
            name: 'Coquette',
            description: 'The Coquette and its D10 variation feature heavily in the second trailer.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/d6/Coquette.png?width=960',
            imageTitle: 'Coquette',
            url: GUIDE_URLS.cars,
          },
        ],
      },
      {
        id: 'new-cars',
        title: 'New Cars',
        items: [
          {
            id: 'jason-s-vapid-ute',
            name: "Jason's Vapid Ute",
            description: "This Vapid is seen several times and appears to be Jason's main car in GTA 6.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/10/Jason_Car.png?width=960',
            imageTitle: 'Jason Car',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'rancher-like-pickup',
            name: 'Rancher-like Pickup',
            description: 'This new pickup is seemingly based on a 1989 Chevy, though it could be an updated Rancher.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/11/New_Truck.png?width=960',
            imageTitle: 'New Truck',
            url: GUIDE_URLS.cars,
          },
          {
            id: 'eudora-like-classic-car',
            name: 'Eudora-like Classic Car',
            description: 'This classic car looks a lot like the Eudora in GTA Online.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/9/93/Eudora.png?width=960',
            imageTitle: 'Eudora',
            url: GUIDE_URLS.cars,
          },
        ],
      },
    ],
    extraImages: [
      imageAsset('Lowriders and bike customization', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/6/65/Lowriders_and_Bike_Customization1.png?width=960'),
    ],
  },
  motorcycles: {
    id: 'motorcycles',
    updatedAt: '2025-05-08T02:12:50Z',
    intro: [
      "Rockstar hasn't confirmed bikes or motorcycles for GTA 6, but trailers and screenshots show plenty of two-wheeled vehicles.",
      'IGN groups the known bikes and motorcycles into returning, new, and other two-wheeled vehicles.',
    ],
    collections: [
      {
        id: 'returning-motorcycles',
        title: 'Returning Motorcycles',
        items: [
          {
            id: 'avernus',
            name: 'Avernus',
            description: 'A chopper-style bike shown during the second trailer and in screenshots.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/6/67/Jason-gta6.png?width=960',
            imageTitle: 'Avernus',
            url: GUIDE_URLS.motorcycles,
          },
          {
            id: 'sanchez',
            name: 'Sanchez',
            description: 'The fan-favorite dirt bike appears several times.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/a/aa/Outlaw%2C_Sanchez%2C_Blazer.jpg?width=960',
            imageTitle: 'Outlaw, Sanchez, Blazer',
            url: GUIDE_URLS.motorcycles,
          },
          {
            id: 'nagasaki-carbon-rs',
            name: 'Nagasaki Carbon RS',
            description: 'This bike seems to be a Nagasaki Carbon RS with a new paint job.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/0/02/Gta-6-Nagasaki-carbon.png?width=960',
            imageTitle: 'Nagasaki Carbon RS',
            url: GUIDE_URLS.motorcycles,
          },
        ],
      },
      {
        id: 'new-and-updated-motorcycles',
        title: 'New and Updated Motorcycles',
        items: [
          {
            id: 'unknown-motorcycle',
            name: 'Unknown Motorcycle',
            description: "The motorcycle Lucia sits on has not been placed by fans yet, suggesting it may be brand-new.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/0/0c/Motorcycle_1.jpg?width=960',
            imageTitle: 'Motorcycle 1',
            url: GUIDE_URLS.motorcycles,
          },
          {
            id: 'alvino-v1',
            name: 'Alvino V1',
            description: "Jason's motorcycle is an Alvino V1, new to the series and seemingly based on the Ducati Panigale V2.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/79/Alvino_V1.png?width=960',
            imageTitle: 'Alvino V1',
            url: GUIDE_URLS.motorcycles,
          },
        ],
      },
      {
        id: 'bikes-and-others',
        title: 'Bikes and Others',
        items: [
          {
            id: 'cruiser',
            name: 'Cruiser',
            description: 'A classic Cruiser bicycle appears on the left of a street shot.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/2/23/Mobility_Scooter_and_Bicycle.jpg?width=960',
            imageTitle: 'Cruiser',
            url: GUIDE_URLS.motorcycles,
          },
          {
            id: 'e-bike',
            name: 'E-Bike',
            description: 'A promotional screenshot appears to show an E-Bike in downtown Vice City.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/58/E-Bike.png?width=960',
            imageTitle: 'E-Bike',
            url: GUIDE_URLS.motorcycles,
          },
          {
            id: 'mobility-scooter',
            name: 'Mobility Scooter',
            description: 'IGN highlights the mobility scooter as a potential rideable vehicle.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/2/23/Mobility_Scooter_and_Bicycle.jpg?width=960',
            imageTitle: 'Mobility Scooter',
            url: GUIDE_URLS.motorcycles,
          },
        ],
      },
    ],
    extraImages: [
      imageAsset('Mount Kalaga dirt bikes', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/15/Mount-Kalaga-Dirt-Bikes.jpg?width=960'),
    ],
  },
  aircrafts: {
    id: 'aircrafts',
    updatedAt: '2025-05-08T02:10:28Z',
    intro: [
      "No aircraft have been officially confirmed for GTA 6, but Rockstar's trailers and promotional website include planes and helicopters.",
      'IGN separates the spotted aircraft into airplane and helicopter groups.',
    ],
    collections: [
      {
        id: 'airplanes-list',
        title: 'Airplanes List',
        items: [
          {
            id: 'blimp',
            name: 'Blimp',
            description: 'One promotional screenshot gives a clear look at the Blimp.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/19/Blimp.png?width=960',
            imageTitle: 'Blimp',
            url: GUIDE_URLS.aircrafts,
          },
          {
            id: 'luxor',
            name: 'Luxor',
            description: 'A Luxor or similar jet flies over the Vice City sign in one screenshot.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/3/3d/Luxor_Jet.png?width=960',
            imageTitle: 'Luxor Jet',
            url: GUIDE_URLS.aircrafts,
          },
          {
            id: 'dodo',
            name: 'Dodo',
            description: 'The Dodo appears in trailers and screenshots and can land in water.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/2/2e/Mammoth_Dodo.jpg?width=960',
            imageTitle: 'Mammoth Dodo',
            url: GUIDE_URLS.aircrafts,
          },
        ],
      },
      {
        id: 'helicopters-list',
        title: 'Helicopters List',
        items: [
          {
            id: 'buzzard',
            name: 'Buzzard',
            description: 'The Buzzard attack helicopter appears with heavy-duty firepower.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/f/f8/Buzzard.png?width=960',
            imageTitle: 'Buzzard',
            url: GUIDE_URLS.aircrafts,
          },
          {
            id: 'maverick',
            name: 'Maverick',
            description: 'This Maverick seems to be outfitted for a news station.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/a/a1/Maverick.jpg?width=960',
            imageTitle: 'Maverick',
            url: GUIDE_URLS.aircrafts,
          },
          {
            id: 'police-maverick',
            name: 'Police Maverick',
            description: 'This is the police version of the Maverick.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/1d/Police_Maverick.png?width=960',
            imageTitle: 'Police Maverick',
            url: GUIDE_URLS.aircrafts,
          },
          {
            id: 'sea-sparrow',
            name: 'Sea Sparrow',
            description: 'The Sea Sparrow appears in trailers and screenshots and can land in water.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/57/Sea_Sparrow.jpg?width=960',
            imageTitle: 'Sea Sparrow',
            url: GUIDE_URLS.aircrafts,
          },
        ],
      },
    ],
    extraImages: [
      imageAsset('Leonida Keys bridge', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/c/c2/Leonida-Keys-Bridge.jpg?width=960'),
    ],
  },
  boats: {
    id: 'boats',
    updatedAt: '2025-05-08T03:03:14Z',
    intro: [
      'Several watercraft and boats appear in the first two trailers and accompanying screenshots.',
      'IGN collects the known watercraft and boats, including new and returning types.',
    ],
    collections: [
      {
        id: 'watercraft-and-boats-list',
        title: 'Watercraft and Boats List',
        items: [
          {
            id: 'airboat',
            name: 'Airboat',
            description: "The Airboat appears across trailers and screenshots and fits Rockstar's Everglades-inspired wetlands.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/3/3d/Gta-6-airboat.png?width=960',
            imageTitle: 'Airboat',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'toro',
            name: 'Toro',
            description: 'IGN notes this speedboat may be a new version of the Toro.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/1d/Police_Maverick.png?width=960',
            imageTitle: 'Toro',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'pontoon-boat',
            name: 'Pontoon Boat',
            description: 'One screenshot shows a pontoon boat, potentially new for the series.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/15/Pontoon_Boat.jpg?width=960',
            imageTitle: 'Pontoon Boat',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'speedboat',
            name: 'Speedboat',
            description: "A shot from the first trailer features another speedboat that does not appear to be the Toro.",
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/1/1a/Speedboat.jpg?width=960',
            imageTitle: 'Speedboat',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'seashark',
            name: 'Seashark',
            description: 'The Seashark has appeared in both trailers.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/e/e7/Seashark.png?width=960',
            imageTitle: 'Seashark',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'kayak',
            name: 'Kayak',
            description: 'The kayak appears in promotional screenshots and would be a series first if usable.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/7/74/Mount-Kalaga-Kayaking.jpg?width=960',
            imageTitle: 'Kayak',
            url: GUIDE_URLS.boats,
          },
          {
            id: 'yacht',
            name: 'Yacht',
            description: 'Yachts appear throughout the material released so far.',
            imageUrl: 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/5/54/Yacht.png?width=960',
            imageTitle: 'Yacht',
            url: GUIDE_URLS.boats,
          },
        ],
      },
    ],
    extraImages: [
      imageAsset('Boats', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/d/d6/Boats.jpg?width=960'),
    ],
  },
}

const VEHICLES_FALLBACK = {
  updatedAt: '2025-05-08T03:14:03Z',
  intro: [
    "No cars, boats, aircrafts, and other vehicles have been officially confirmed for GTA 6, but Rockstar's trailers and screenshots show plenty of recognizable vehicles.",
    "IGN splits the spotted vehicles into cars, motorcycles, aircrafts, and boats subpages.",
  ],
  images: [
    imageAsset('Lowriders and bike customization', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/gta-6/6/65/Lowriders_and_Bike_Customization1.png?width=960'),
  ],
  categories: Object.values(VEHICLE_CATEGORY_FALLBACKS),
}

const SIMPLE_GUIDES = [
  {
    id: 'weapons',
    key: 'weapons',
    url: GUIDE_URLS.weapons,
    icon: Crosshair,
    fallback: WEAPONS_FALLBACK,
  },
  {
    id: 'social-media-guide',
    key: 'socialMedia',
    url: GUIDE_URLS.socialMedia,
    icon: Radio,
    fallback: SOCIAL_MEDIA_FALLBACK,
  },
]

const VEHICLE_CATEGORIES = [
  { id: 'cars', url: GUIDE_URLS.cars, icon: Car },
  { id: 'motorcycles', url: GUIDE_URLS.motorcycles, icon: Bike },
  { id: 'aircrafts', url: GUIDE_URLS.aircrafts, icon: Plane },
  { id: 'boats', url: GUIDE_URLS.boats, icon: Ship },
]

function countImages(collections = [], extraImages = []) {
  return collections.reduce((total, collection) => {
    return total + collection.items.filter((item) => item.imageUrl).length
  }, extraImages.length)
}

function flatItems(collections = []) {
  return collections.flatMap((collection) => collection.items.map((item) => ({
    ...item,
    groupId: collection.id,
    groupTitle: collection.title,
  })))
}

function GuideImage({ image }) {
  return (
    <figure className="ign-guide-image-card">
      <img src={image.url} alt={image.title} loading="lazy" decoding="async" />
      <figcaption>
        <ImageIcon size={14} />
        {image.title}
      </figcaption>
    </figure>
  )
}

function GuideCard({ item, sourceLabel, copy, index = 0, onZoom }) {
  const groupLabel = item.groupId
    ? translatedCollectionTitle(copy, { id: item.groupId, title: item.groupTitle })
    : item.groupTitle

  return (
    <button
      type="button"
      className="ign-guide-card"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onZoom(item)}
    >
      <div className="ign-guide-card-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.imageTitle || item.name} loading="lazy" decoding="async" />
        ) : (
          <span>
            <ImageIcon size={24} />
          </span>
        )}
      </div>
      <div className="ign-guide-card-body">
        <span className="ign-guide-source">
          <Tag size={13} />
          <span>{groupLabel || sourceLabel}</span>
        </span>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
    </button>
  )
}

function OverviewPanel({ copy, data, stats, images = [] }) {
  return (
    <>
      <div className="ign-guide-overview">
        <div>
          <span className="ign-guide-kicker">{copy.updatedOn} {formatUpdatedAt(data.updatedAt)}</span>
          <div className="ign-guide-copy">
            {data.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="ign-guide-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="ign-guide-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {images.length > 0 && (
        <div className="ign-guide-image-strip" aria-label={copy.mediaLabel}>
          {images.map((image) => (
            <GuideImage key={image.id} image={image} />
          ))}
        </div>
      )}
    </>
  )
}

function SimpleGuideSection({ config }) {
  const { t, lang } = useTranslation()
  const copy = guideCopy(t, config.key)
  const [data, setData] = useState(config.fallback)
  const [loading, setLoading] = useState(false)
  const [zoomed, setZoomed] = useState(null)

  useEffect(() => {
    let canceled = false

    const fetchGuide = async () => {
      try {
        const html = await fetchTextWithTimeout(config.url)
        const parsedData = parseGuidePage(html, config.url, config.fallback)
        if (!canceled) {
          setData(parsedData)
        }
      } catch (error) {
        console.log(`IGN ${config.key} fetch failed, using fallback:`, error)
        if (!canceled) {
          setData(config.fallback)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchGuide()

    return () => {
      canceled = true
    }
  }, [config])

  const translationSource = useMemo(() => guideTranslationSource(data), [data])
  const { data: displayData } = useTranslatedIgnContent(data, {
    enabled: !loading,
    lang,
    scope: `guide-${config.key}`,
    source: translationSource,
    translate: translateGuideData,
  })

  const itemCount = useMemo(() => flatItems(displayData.collections).length, [displayData.collections])
  const stats = useMemo(
    () => [
      { label: copy.stats.items, value: itemCount },
      { label: copy.stats.images, value: countImages(displayData.collections, displayData.extraImages) },
      { label: copy.stats.groups, value: displayData.collections.length },
    ],
    [copy, displayData.collections, displayData.extraImages, itemCount],
  )

  return (
    <section id={config.id} className="section-padding ign-guide-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {copy.title} <span className="gradient-text">{copy.titleHighlight}</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{copy.loading}</p>
          </div>
        )}

        {!loading && (
          <div className="ign-guide-content">
            <OverviewPanel copy={copy} data={displayData} stats={stats} images={displayData.extraImages} />

            {displayData.collections.map((collection) => (
              <article key={collection.id} className="ign-guide-collection">
                <div className="ign-guide-collection-heading">
                  <h3>{translatedCollectionTitle(copy, collection)}</h3>
                  <span>{collection.items.length} {copy.itemsLabel}</span>
                </div>
                <div className="ign-guide-grid">
                  {flatItems([collection]).map((item, index) => (
                    <GuideCard
                      key={item.id}
                      item={item}
                      sourceLabel={copy.sourceLabel}
                      copy={copy}
                      index={index}
                      onZoom={setZoomed}
                    />
                  ))}
                </div>
              </article>
            ))}
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

export function VehiclesGuide() {
  const { t, lang } = useTranslation()
  const { translateVehicleNames } = usePreferences()
  const copy = guideCopy(t, 'vehicles')
  const [data, setData] = useState(VEHICLES_FALLBACK)
  const [activeCategoryId, setActiveCategoryId] = useState('cars')
  const [loading, setLoading] = useState(false)
  const [zoomed, setZoomed] = useState(null)

  useEffect(() => {
    let canceled = false

    const fetchVehicles = async () => {
      try {
        const overviewHtml = await fetchTextWithTimeout(GUIDE_URLS.vehicles)
        const overview = parseVehicleOverviewPage(overviewHtml, VEHICLES_FALLBACK)

        const categories = await Promise.all(
          VEHICLE_CATEGORIES.map(async (category) => {
            const fallback = VEHICLE_CATEGORY_FALLBACKS[category.id]

            try {
              const html = await fetchTextWithTimeout(category.url)
              return {
                id: category.id,
                ...parseGuidePage(html, category.url, fallback),
              }
            } catch (error) {
              console.log(`IGN ${category.id} fetch failed, using fallback:`, error)
              return fallback
            }
          }),
        )

        if (!canceled) {
          setData({
            ...overview,
            categories,
          })
        }
      } catch (error) {
        console.log('IGN vehicles fetch failed, using fallback:', error)
        if (!canceled) {
          setData(VEHICLES_FALLBACK)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchVehicles()

    return () => {
      canceled = true
    }
  }, [])

  const shouldTranslateVehicleNames = lang !== 'en' && translateVehicleNames
  const translationSource = useMemo(
    () => vehiclesTranslationSource(data, { translateNames: shouldTranslateVehicleNames }),
    [data, shouldTranslateVehicleNames],
  )
  const translateVehicleContent = useCallback(
    (nextData, nextLang) => translateVehiclesData(nextData, nextLang, {
      translateNames: shouldTranslateVehicleNames,
    }),
    [shouldTranslateVehicleNames],
  )
  const { data: displayData } = useTranslatedIgnContent(data, {
    enabled: !loading,
    lang,
    scope: shouldTranslateVehicleNames ? 'vehicles-with-names' : 'vehicles-source-names',
    source: translationSource,
    translate: translateVehicleContent,
  })

  const activeCategory = displayData.categories.find((category) => category.id === activeCategoryId) || displayData.categories[0]
  const activeConfig = VEHICLE_CATEGORIES.find((category) => category.id === activeCategory?.id) || VEHICLE_CATEGORIES[0]
  const ActiveIcon = activeConfig.icon

  const vehicleCount = useMemo(
    () => displayData.categories.reduce((total, category) => total + flatItems(category.collections).length, 0),
    [displayData.categories],
  )

  const imageCount = useMemo(
    () => displayData.categories.reduce((total, category) => total + countImages(category.collections, category.extraImages), displayData.images.length),
    [displayData.categories, displayData.images],
  )

  const stats = useMemo(
    () => [
      { label: copy.stats.categories, value: displayData.categories.length },
      { label: copy.stats.vehicles, value: vehicleCount },
      { label: copy.stats.images, value: imageCount },
    ],
    [copy, displayData.categories.length, imageCount, vehicleCount],
  )

  return (
    <section id="vehicles" className="section-padding ign-guide-section vehicles-guide-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {copy.title} <span className="gradient-text">{copy.titleHighlight}</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{copy.loading}</p>
          </div>
        )}

        {!loading && activeCategory && (
          <div className="ign-guide-content">
            <OverviewPanel copy={copy} data={displayData} stats={stats} images={displayData.images} />

            <div className="vehicle-tabs" role="tablist" aria-label="GTA 6 vehicle subpages">
              {displayData.categories.map((category) => {
                const tabConfig = VEHICLE_CATEGORIES.find((item) => item.id === category.id) || VEHICLE_CATEGORIES[0]
                const TabIcon = tabConfig.icon
                const count = flatItems(category.collections).length

                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategoryId === category.id}
                    className={activeCategoryId === category.id ? 'active' : ''}
                    onClick={() => setActiveCategoryId(category.id)}
                  >
                    <TabIcon size={17} />
                    <span>{copy.tabs[category.id] || category.id}</span>
                    <strong>{count}</strong>
                  </button>
                )
              })}
            </div>

            <article id={`vehicles-${activeCategory.id}`} className="vehicle-subpage" role="tabpanel">
              <div className="vehicle-subpage-heading">
                <div>
                  <span>
                    <ActiveIcon size={14} />
                    {copy.subpageLabel}
                  </span>
                  <h3>{copy.tabs[activeCategory.id] || activeCategory.id}</h3>
                </div>
                <a href={activeConfig.url} target="_blank" rel="noopener noreferrer">
                  {copy.ignGuide}
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="ign-guide-copy vehicle-subpage-copy">
                {activeCategory.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {activeCategory.extraImages.length > 0 && (
                <div className="ign-guide-image-strip compact" aria-label={copy.mediaLabel}>
                  {activeCategory.extraImages.map((image) => (
                    <GuideImage key={image.id} image={image} />
                  ))}
                </div>
              )}

              {activeCategory.collections.map((collection) => (
                <div key={collection.id} className="ign-guide-collection">
                  <div className="ign-guide-collection-heading">
                    <h3>{translatedCollectionTitle(copy, collection)}</h3>
                    <span>{collection.items.length} {copy.itemsLabel}</span>
                  </div>
                  <div className="ign-guide-grid">
                    {flatItems([collection]).map((item, index) => (
                      <GuideCard
                        key={item.id}
                        item={item}
                        sourceLabel={copy.sourceLabel}
                        copy={copy}
                        index={index}
                        onZoom={setZoomed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </article>
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

function IgnGuideSections() {
  return (
    <>
      <WeaponsGuide />
      <SocialMediaGuide />
      <VehiclesGuide />
    </>
  )
}

export function WeaponsGuide() {
  return <SimpleGuideSection config={SIMPLE_GUIDES[0]} />
}

export function SocialMediaGuide() {
  return <SimpleGuideSection config={SIMPLE_GUIDES[1]} />
}

export default IgnGuideSections
