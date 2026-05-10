import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, Gamepad2, Globe, LogOut, MapPin, User } from 'lucide-react'
import Countdown from './Countdown'
import favIcon from '../assets/fav.png'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { LANGUAGE_NAMES } from '../i18n/translations'
import './Hero.css'

const RELEASE_DATE = new Date('2026-11-19T00:00:00')

function Hero({ currentUser, onOpenAuth, onLogout }) {
  const { t, lang, setLang } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!langOpen) return
    const close = () => setLangOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [langOpen])

  const scrollToInfo = () => {
    document.getElementById('game-info')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <img className="nav-favicon" src={favIcon} alt="" aria-hidden="true" />
          <span>GTA VI <span className="highlight">HUB</span></span>
        </div>
        <div className="nav-links">
          <a href="#game-info">{t.nav.about}</a>
          <a href="#characters">{t.nav.characters}</a>
          <a href="#media">{t.nav.media}</a>
          <a href="#leonida">{t.nav.leonida}</a>
          <a href="#news">{t.nav.news}</a>
          <a href="#social">{t.nav.social}</a>
        </div>
        <div className="nav-auth">
          {/* Language switcher */}
          <div className="lang-switcher" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lang-toggle"
              onClick={() => setLangOpen((o) => !o)}
              aria-label="Change language"
              aria-expanded={langOpen}
            >
              <Globe size={15} />
              <span>{LANGUAGE_NAMES[lang]}</span>
            </button>
            {langOpen && (
              <ul className="lang-dropdown" role="listbox">
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={lang === code}
                      className={lang === code ? 'active' : ''}
                      onClick={() => { setLang(code); setLangOpen(false) }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {currentUser ? (
            <>
              <a className="nav-profile" href="#social" aria-label="Open profile">
                <span style={{ backgroundColor: `${currentUser.avatarColor}22`, color: currentUser.avatarColor }}>
                  {currentUser.initials}
                </span>
                <strong>{currentUser.username}</strong>
              </a>
              <button type="button" onClick={onLogout} aria-label={t.nav.logOut}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button type="button" onClick={onOpenAuth}>
              <User size={16} />
              <span>{t.nav.signIn}</span>
            </button>
          )}
        </div>
      </nav>

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
