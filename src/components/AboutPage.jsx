import {
  CalendarDays,
  DollarSign,
  ExternalLink,
  Gamepad2,
  Globe2,
  Info,
  Map,
  Users,
} from 'lucide-react'
import Countdown from './Countdown'
import GameInfo from './GameInfo'
import PromoGallery from './PromoGallery'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './AboutPage.css'

const RELEASE_DATE = new Date('2026-11-19T00:00:00')
const OFFICIAL_SOURCE = 'https://ir.take2games.com/node/32311/pdf'
const WIKIPEDIA_SOURCE = 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI'
const MAP_SOURCE = 'https://www.gtavimods.com/gta-6-map-size-official-regions-what-to-expect/'

function AboutPage() {
  const { t } = useTranslation()
  const copy = t.aboutPage

  const stats = [
    {
      id: 'release',
      value: 'NOV 19, 2026',
      icon: CalendarDays,
      status: 'official',
      source: OFFICIAL_SOURCE,
    },
    {
      id: 'price',
      value: '$79.99',
      icon: DollarSign,
      status: 'official',
      source: OFFICIAL_SOURCE,
    },
    {
      id: 'budget',
      value: '$1–2B',
      icon: Globe2,
      status: 'estimate',
      source: WIKIPEDIA_SOURCE,
    },
    {
      id: 'team',
      value: '≈4K–6K',
      icon: Users,
      status: 'estimate',
    },
    {
      id: 'map',
      value: '≈125 KM²',
      icon: Map,
      status: 'estimate',
      source: MAP_SOURCE,
    },
    {
      id: 'regions',
      value: '06',
      icon: Gamepad2,
      status: 'official',
      source: 'https://www.rockstargames.com/VI',
    },
  ]

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-grid" aria-hidden="true" />
        <div className="about-hero-orb about-orb-pink" aria-hidden="true" />
        <div className="about-hero-orb about-orb-cyan" aria-hidden="true" />

        <div className="container about-hero-inner">
          <div className="about-hero-copy">
            <span className="about-kicker"><Info size={15} /> {copy.hero.kicker}</span>
            <h1>{copy.hero.title} <span>{copy.hero.titleHighlight}</span></h1>
            <p>{copy.hero.description}</p>
            <div className="about-release-meta">
              <span><CalendarDays size={16} /> {t.hero.releaseDate}</span>
              <span><Gamepad2 size={16} /> {t.hero.platforms}</span>
            </div>
          </div>

          <div className="about-countdown-card">
            <span>{copy.hero.launchCard}</span>
            <Countdown targetDate={RELEASE_DATE} />
          </div>
        </div>
      </section>

      <section className="section-padding about-stats-section">
        <div className="container">
          <header className="about-section-heading">
            <div>
              <span>{copy.stats.eyebrow}</span>
              <h2>{copy.stats.title}</h2>
            </div>
            <p>{copy.stats.description}</p>
          </header>

          <div className="about-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon
              const itemCopy = copy.stats.items[stat.id]

              return (
                <article key={stat.id} className={`about-stat-card status-${stat.status}`}>
                  <div className="about-stat-topline">
                    <span className="about-stat-icon"><Icon size={18} /></span>
                    <span className="about-stat-status">
                      {stat.status === 'official' ? copy.stats.official : copy.stats.estimate}
                    </span>
                  </div>
                  <strong>{stat.value}</strong>
                  <h3>{itemCopy.label}</h3>
                  <p>{itemCopy.note}</p>
                  {stat.source && (
                    <a href={stat.source} target="_blank" rel="noopener noreferrer" aria-label={`${itemCopy.label} source`}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </article>
              )
            })}
          </div>

        </div>
      </section>

      <GameInfo />

      <PromoGallery copy={copy.media} />

      <section className="about-sources-section">
        <div className="container about-sources-inner">
          <span>{copy.sources.label}</span>
          <div>
            <a href={OFFICIAL_SOURCE} target="_blank" rel="noopener noreferrer">
              {copy.sources.official} <ExternalLink size={13} />
            </a>
            <a href={WIKIPEDIA_SOURCE} target="_blank" rel="noopener noreferrer">
              {copy.sources.wikipedia} <ExternalLink size={13} />
            </a>
            <a href={MAP_SOURCE} target="_blank" rel="noopener noreferrer">
              {copy.sources.map} <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
