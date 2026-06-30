import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getLeonidaSection, LEONIDA_SECTIONS } from '../data/leonidaSections'
import Characters from './Characters'
import { SocialMediaGuide, VehiclesGuide, WeaponsGuide } from './IgnGuide'
import LeonidaLocations from './LeonidaLocations'
import './LeonidaGuidePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function LeonidaGuidePage({ sectionId, onNavigate }) {
  const section = getLeonidaSection(sectionId) || LEONIDA_SECTIONS[0]
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

  return (
    <div className={`leonida-guide-page guide-${section.accent}`}>
      <header className="leonida-guide-hero">
        <img src={section.image} alt="" aria-hidden="true" />
        <span className="leonida-guide-hero-scrim" aria-hidden="true" />
        <div className="container leonida-guide-hero-content">
          <a className="leonida-guide-back" href="/leonida" onClick={(event) => navigate(event, '/leonida')}>
            <ArrowLeft size={16} /> All Leonida guides
          </a>
          <div className="leonida-guide-title-row">
            <span className="leonida-guide-title-icon"><SectionIcon size={24} /></span>
            <div>
              <p>{section.shortTitle}</p>
              <h1>{section.title}</h1>
            </div>
          </div>
          <p className="leonida-guide-description">{section.description}</p>
        </div>
      </header>

      <nav className="leonida-guide-tabs" aria-label="Leonida guide sections">
        <div className="container">
          {LEONIDA_SECTIONS.map((item) => (
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

      {renderSection()}
    </div>
  )
}

export default LeonidaGuidePage
