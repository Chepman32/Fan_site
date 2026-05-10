import { useEffect, useState } from 'react'
import { Ellipsis, Globe, LogOut, User } from 'lucide-react'
import favIcon from '../assets/fav.png'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { LANGUAGE_NAMES } from '../i18n/translations'
import './Header.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function Header({ currentUser, onOpenAuth, onLogout, onNavigate, solid = false }) {
  const { t, lang, setLang } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!langOpen) return undefined
    const close = () => setLangOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [langOpen])

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <nav className={`navbar ${solid || scrolled ? 'scrolled' : ''}`}>
      <a className="nav-brand" href="/" onClick={(event) => navigate(event, '/')}>
        <img className="nav-favicon" src={favIcon} alt="" aria-hidden="true" />
        <span>GTA VI <span className="highlight">HUB</span></span>
      </a>

      <div className="nav-links">
        <a href="/#game-info" onClick={(event) => navigate(event, '/#game-info')}>{t.nav.about}</a>
        <a href="/#characters" onClick={(event) => navigate(event, '/#characters')}>{t.nav.characters}</a>
        <div className="nav-more">
          <button type="button" className="nav-more-toggle" aria-label="Show more guide links" aria-haspopup="true">
            <Ellipsis size={20} />
          </button>
          <div className="nav-more-menu" role="menu">
            <a href="/#weapons" role="menuitem" onClick={(event) => navigate(event, '/#weapons')}>
              {t.nav.weapons || 'Weapons'}
            </a>
            <a href="/#vehicles" role="menuitem" onClick={(event) => navigate(event, '/#vehicles')}>
              {t.nav.vehicles || 'Vehicles'}
            </a>
            <a
              href="/#social-media-guide"
              role="menuitem"
              onClick={(event) => navigate(event, '/#social-media-guide')}
            >
              {t.nav.socialMedia || 'Social Media'}
            </a>
          </div>
        </div>
        <a href="/#media" onClick={(event) => navigate(event, '/#media')}>{t.nav.media}</a>
        <a href="/#leonida" onClick={(event) => navigate(event, '/#leonida')}>{t.nav.leonida}</a>
        <a href="/#news" onClick={(event) => navigate(event, '/#news')}>{t.nav.news}</a>
        <a href="/community" onClick={(event) => navigate(event, '/community')}>
          {t.nav.community || t.nav.social || 'Community'}
        </a>
      </div>

      <div className="nav-auth">
        <div className="lang-switcher" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLangOpen((open) => !open)}
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
            <a
              className="nav-profile"
              href="/profile"
              onClick={(event) => navigate(event, '/profile')}
              aria-label="Open profile"
            >
              <span
                className="nav-profile-avatar"
                style={{ backgroundColor: `${currentUser.avatarColor}22`, color: currentUser.avatarColor }}
              >
                {currentUser.photoDataUrl ? (
                  <img src={currentUser.photoDataUrl} alt="" aria-hidden="true" />
                ) : (
                  currentUser.initials
                )}
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
  )
}

export default Header
