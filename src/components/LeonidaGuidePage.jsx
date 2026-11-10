import { ArrowLeft, ArrowRight } from 'lucide-react'
import { localizeLeonidaSections } from '../data/leonidaSections'
import { useTranslation } from '../i18n/useTranslation.jsx'
import Characters from './Characters'
import { SocialMediaGuide, VehiclesGuide, WeaponsGuide } from './IgnGuide'
import LeonidaLocations from './LeonidaLocations'
import './LeonidaGuidePage.css'

const GUIDE_INTROS = {
  vehicles: [
    {
      title: 'On the road, water, and in the air',
      body: 'Browse the cars, motorcycles, aircraft, boats, and service vehicles seen in footage from Vice City and across Leonida.',
    },
    {
      title: 'How vehicles are identified',
      body: 'Trailer appearances and community identifications are labeled separately. Some vehicles may have different names in the finished game.',
    },
  ],
  weapons: [
    {
      title: 'Weapons spotted so far',
      body: 'See the firearms and melee weapons spotted in public footage, with links to the material behind each identification.',
    },
    {
      title: 'What remains unknown',
      body: 'Some names and mechanics are still unconfirmed. The guide labels fan identifications separately from official details.',
    },
  ],
  'social-media': [
    {
      title: 'Life on Leonida’s feed',
      body: 'From viral wildlife clips to local music and livestreams, Leonida’s fictional feeds offer glimpses of the people and places around the state.',
    },
    {
      title: 'Who’s behind the accounts?',
      body: 'Browse handles spotted in public footage and see which ones can be linked to known characters.',
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
  const primers = GUIDE_INTROS[section.id] || []

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
