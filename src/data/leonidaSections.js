import {
  Car,
  Crosshair,
  MapPinned,
  Radio,
  UserRoundSearch,
} from 'lucide-react'

export const LEONIDA_SECTIONS = [
  {
    id: 'characters',
    title: 'Characters',
    shortTitle: 'People of Leonida',
    description: 'Meet Lucia, Jason, and the hustlers, artists, fixers, and wild cards orbiting their story.',
    image: '/images/leonida/characters.webp',
    href: '/leonida/characters',
    icon: UserRoundSearch,
    accent: 'pink',
    count: '9 profiles',
  },
  {
    id: 'locations',
    title: 'Locations',
    shortTitle: 'Explore the state',
    description: 'Travel from Vice City neon to the Keys, wetlands, faded port towns, and mountain wilderness.',
    image: '/images/leonida/locations-day.webp',
    href: '/leonida/locations',
    icon: MapPinned,
    accent: 'cyan',
    tone: 'day',
    count: '6 major regions',
  },
  {
    id: 'vehicles',
    title: 'Vehicles',
    shortTitle: 'Road, air & water',
    description: 'Browse the cars, motorcycles, aircraft, and watercraft spotted across trailers and screenshots.',
    image: '/images/leonida/vehicles-day.webp',
    href: '/leonida/vehicles',
    icon: Car,
    accent: 'purple',
    tone: 'day',
    count: '4 collections',
  },
  {
    id: 'weapons',
    title: 'Weapons',
    shortTitle: 'The known arsenal',
    description: 'Review every firearm and melee weapon identified so far, with visual references and context.',
    image: '/images/leonida/weapons.webp',
    href: '/leonida/weapons',
    icon: Crosshair,
    accent: 'orange',
    count: '9 spotted items',
  },
  {
    id: 'social-media',
    title: 'In-game social media',
    shortTitle: 'Leonida goes live',
    description: 'Follow the fictional accounts, viral clips, and chaotic local personalities shaping the feed.',
    image: '/images/leonida/social-media-day.webp',
    href: '/leonida/social-media',
    icon: Radio,
    accent: 'blue',
    tone: 'day',
    count: '5 known accounts',
  },
]

export function getLeonidaSection(sectionId) {
  return LEONIDA_SECTIONS.find((section) => section.id === sectionId) || null
}

export function localizeLeonidaSections(copy) {
  return LEONIDA_SECTIONS.map((section) => ({
    ...section,
    ...(copy?.sections?.[section.id] || {}),
  }))
}
