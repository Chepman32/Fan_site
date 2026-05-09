import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, Gamepad2, LogOut, MapPin, User } from 'lucide-react'
import Countdown from './Countdown'
import favIcon from '../assets/fav.png'
import './Hero.css'

const RELEASE_DATE = new Date('2026-11-19T00:00:00')

function Hero({ currentUser, onOpenAuth, onLogout }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          <a href="#game-info">About</a>
          <a href="#characters">Characters</a>
          <a href="#media">Media</a>
          <a href="#news">News</a>
          <a href="#social">Social</a>
        </div>
        <div className="nav-auth">
          {currentUser ? (
            <>
              <a className="nav-profile" href="#social" aria-label="Open profile">
                <span style={{ backgroundColor: `${currentUser.avatarColor}22`, color: currentUser.avatarColor }}>
                  {currentUser.initials}
                </span>
                <strong>{currentUser.username}</strong>
              </a>
              <button type="button" onClick={onLogout} aria-label="Log out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button type="button" onClick={onOpenAuth}>
              <User size={16} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </nav>

      <div className="hero-content">
        <div className="hero-badge animate-fade-in-up">
          <MapPin size={14} />
          <span>LEONIDA / VICE CITY</span>
        </div>

        <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          GRAND THEFT AUTO
          <span className="hero-number">VI</span>
        </h1>

        <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The most anticipated game of the decade. 
          Return to Vice City in a story of love, crime, and betrayal.
        </p>

        <div className="hero-meta animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="meta-item">
            <Calendar size={16} />
            <span>November 19, 2026</span>
          </div>
          <div className="meta-divider"></div>
          <div className="meta-item">
            <Gamepad2 size={16} />
            <span>PS5 / Xbox Series X|S</span>
          </div>
        </div>

        <div className="hero-countdown animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Countdown targetDate={RELEASE_DATE} />
        </div>

        <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button className="btn-primary" onClick={scrollToInfo}>
            Explore Game
          </button>
          <a 
            href="https://www.rockstargames.com/VI" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Official Site
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
