import { Calendar, ChevronDown, Gamepad2, MapPin } from 'lucide-react'
import Countdown from './Countdown'
import Header from './Header'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './Hero.css'

const RELEASE_DATE = new Date('2026-11-19T00:00:00')

function Hero({ currentUser, onOpenAuth, onLogout, onNavigate }) {
  const { t } = useTranslation()

  const scrollToInfo = () => {
    document.getElementById('game-info')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero">
      <Header
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      <div className="hero-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="hero-badge animate-fade-in-up">
          <MapPin size={14} />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          GRAND THEFT AUTO
          <span className="hero-number">VI</span>
        </h1>

        <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {t.hero.subtitle}
        </p>

        <div className="hero-meta animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="meta-item">
            <Calendar size={16} />
            <span>{t.hero.releaseDate}</span>
          </div>
          <div className="meta-divider"></div>
          <div className="meta-item">
            <Gamepad2 size={16} />
            <span>{t.hero.platforms}</span>
          </div>
        </div>

        <div className="hero-countdown animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Countdown targetDate={RELEASE_DATE} />
        </div>

        <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button className="btn-primary" onClick={scrollToInfo}>
            {t.hero.exploreGame}
          </button>
          <a
            href="https://www.rockstargames.com/VI"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            {t.hero.officialSite}
          </a>
        </div>
      </div>

      <button className="scroll-indicator" onClick={scrollToInfo}>
        <ChevronDown size={24} className="animate-float" />
      </button>
    </section>
  )
}

export default Hero
