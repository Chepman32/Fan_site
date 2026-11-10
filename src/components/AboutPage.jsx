import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  Download,
  ExternalLink,
  Gamepad2,
  HardDrive,
  Info,
  Map,
  Monitor,
  Users,
} from 'lucide-react'
import Countdown from './Countdown'
import GameInfo from './GameInfo'
import MediaGallery from './MediaGallery'
import PromoGallery from './PromoGallery'
import { gtaViLaunchSources } from '../content/news'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './AboutPage.css'

const RELEASE_DATE = new Date('2026-11-19T00:00:00')
const OFFICIAL_SOURCE = gtaViLaunchSources.official
const EDITIONS_SOURCE = 'https://www.playstation.com/en-us/games/grand-theft-auto-vi/'
const PREORDER_SOURCE = 'https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25'
const PRELOAD_SOURCE = 'https://support.rockstargames.com/articles/7nPqOA2uCbpEQHXx7KVrYd/grand-theft-auto-vi-pre-load-faq'
const WIKIPEDIA_SOURCE = 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI'
const LOCATIONS_SOURCE = 'https://www.rockstargames.com/VI/only-in-leonida'

function AboutPage() {
  const { t } = useTranslation()
  const copy = t.aboutPage

  const scrollToContent = (event) => {
    event.preventDefault()
    document.getElementById('about-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stats = [
    {
      id: 'release',
      value: 'NOV 19, 2026',
      icon: CalendarDays,
      status: 'official',
      source: gtaViLaunchSources.regionalTimes,
    },
    {
      id: 'price',
      value: '$79.99',
      icon: DollarSign,
      status: 'official',
      source: EDITIONS_SOURCE,
    },
    {
      id: 'ultimate',
      value: '$99.99',
      icon: DollarSign,
      status: 'official',
      source: EDITIONS_SOURCE,
    },
    {
      id: 'preload',
      value: copy.stats.items.preload.value,
      icon: Download,
      status: 'official',
      source: gtaViLaunchSources.regionalTimes,
    },
    {
      id: 'storage',
      value: '212 GB',
      icon: HardDrive,
      status: 'official',
      source: PRELOAD_SOURCE,
    },
    {
      id: 'regions',
      value: '06',
      icon: Map,
      status: 'official',
      source: LOCATIONS_SOURCE,
    },
    {
      id: 'storyMode',
      value: copy.stats.items.storyMode.value,
      icon: Gamepad2,
      status: 'official',
      source: PREORDER_SOURCE,
    },
    {
      id: 'pc',
      value: copy.stats.items.pc.value,
      icon: Monitor,
      status: 'reported',
      source: gtaViLaunchSources.pcReport,
    },
    {
      id: 'online',
      value: '2027',
      icon: Users,
      status: 'reported',
      source: gtaViLaunchSources.onlineReport,
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
            <a className="about-hero-cta" href="#about-content" onClick={scrollToContent}>
              {copy.hero.contentCta}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="about-countdown-card">
            <span>{copy.hero.launchCard}</span>
            <Countdown targetDate={RELEASE_DATE} />
          </div>
        </div>
      </section>

      <section id="about-content" className="section-padding about-stats-section">
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
                      {copy.stats[stat.status]}
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

      <MediaGallery copy={copy.media} />

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
            <a href={gtaViLaunchSources.takeTwo} target="_blank" rel="noopener noreferrer">
              {copy.sources.takeTwo} <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
