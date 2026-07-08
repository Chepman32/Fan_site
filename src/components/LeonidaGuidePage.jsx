import { ArrowLeft, ArrowRight } from 'lucide-react'
import { localizeLeonidaSections } from '../data/leonidaSections'
import { useTranslation } from '../i18n/useTranslation.jsx'
import Characters from './Characters'
import { SocialMediaGuide, VehiclesGuide, WeaponsGuide } from './IgnGuide'
import LeonidaLocations from './LeonidaLocations'
import './LeonidaGuidePage.css'

const SEO_PRIMERS = {
  vehicles: [
    {
      title: 'Vehicle categories in public GTA VI media',
      body: 'Leonida footage points to a broad vehicle mix across city streets, coastal highways, rural roads, waterways, and air travel. This guide keeps cars, motorcycles, aircraft, boats, service vehicles, and off-road references grouped by source context so readers can scan what is visible without treating fan guesses as final vehicle names.',
    },
    {
      title: 'How to read this vehicle guide',
      body: 'Use the vehicle lists as a source-linked field guide rather than a final garage roster. Leonida Loot separates confirmed public trailer appearances from community interpretation, then connects vehicle interest to related map, character, and creator asset pages.',
    },
  ],
  weapons: [
    {
      title: 'Known weapon references',
      body: 'The GTA VI weapons page tracks public references to firearms and close-range items while avoiding claims based on leaks, datamining, or unsupported screenshots. Each item should be understood as trailer and wiki context until Rockstar publishes final gameplay systems.',
    },
    {
      title: 'Why this page stays cautious',
      body: 'Weapon searches attract rumor-heavy results, so Leonida Loot keeps confidence levels clear. The goal is to help readers understand visible categories, source material, and related story or location context without presenting speculation as a confirmed arsenal.',
    },
  ],
  'social-media': [
    {
      title: 'In-game social media as worldbuilding',
      body: 'GTA VI uses fictional social feeds, viral clips, music accounts, livestream-style posts, and local personalities to show how Leonida feels online. This page organizes those public references so fans can connect characters, locations, and events across the reveal material.',
    },
    {
      title: 'Source-linked account tracking',
      body: 'The social media guide focuses on accounts and moments visible in official trailers or reputable wiki coverage. It avoids impersonation claims and treats the fictional handles as worldbuilding clues rather than real accounts or official community channels.',
    },
  ],
}

const GUIDE_H1 = {
  characters: 'GTA VI Characters',
  locations: 'GTA VI Leonida Locations',
  vehicles: 'GTA VI Vehicles',
  weapons: 'GTA VI Weapons',
  'social-media': 'GTA VI Social Media',
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaGuidePage({ sectionId, onNavigate }) {
  const { t } = useTranslation()
  const copy = t.leonidaHub
  const sections = localizeLeonidaSections(copy)
  const section = sections.find((item) => item.id === sectionId) || sections[0]
  const SectionIcon = section.icon

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  const renderSection = () => {
    if (section.id === 'characters') return <Characters />
    if (section.id === 'locations') return <LeonidaLocations onNavigate={onNavigate} />
    if (section.id === 'vehicles') return <VehiclesGuide />
    if (section.id === 'weapons') return <WeaponsGuide />
    return <SocialMediaGuide />
  }
  const primers = SEO_PRIMERS[section.id] || []

  return (
    <div className={`leonida-guide-page guide-${section.accent}`}>
      <header className="leonida-guide-hero">
        <img src={section.image} alt="" aria-hidden="true" />
        <span className="leonida-guide-hero-scrim" aria-hidden="true" />
        <div className="container leonida-guide-hero-content">
          <a className="leonida-guide-back" href="/leonida" onClick={(event) => navigate(event, '/leonida')}>
            <ArrowLeft size={16} /> {copy.guide.back}
          </a>
          <div className="leonida-guide-title-row">
            <span className="leonida-guide-title-icon"><SectionIcon size={24} /></span>
            <div>
              <p>{section.shortTitle}</p>
              <h1>{GUIDE_H1[section.id] || section.title}</h1>
            </div>
          </div>
          <p className="leonida-guide-description">{section.description}</p>
        </div>
      </header>

      <nav className="leonida-guide-tabs" aria-label={copy.guide.tabsLabel}>
        <div className="container">
          {sections.map((item) => (
            <a
              key={item.id}
              className={item.id === section.id ? 'active' : ''}
              href={item.href}
              onClick={(event) => navigate(event, item.href)}
              aria-current={item.id === section.id ? 'page' : undefined}
            >
              <span>{item.title}</span>
              {item.id === section.id && <ArrowRight size={14} />}
            </a>
          ))}
        </div>
      </nav>

      {primers.length > 0 && (
        <section className="leonida-guide-primer">
          <div className="container">
            {primers.map((primer) => (
              <article key={primer.title}>
                <h2>{primer.title}</h2>
                <p>{primer.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {renderSection()}
    </div>
  )
}

export default LeonidaGuidePage
