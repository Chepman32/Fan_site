import { useEffect, useState } from 'react'
import {
  Car,
  Crosshair,
  Ellipsis,
  Globe,
  Home,
  Images,
  Info,
  LogOut,
  MapPinned,
  Newspaper,
  Radio,
  ShoppingCart,
  Store,
  User,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react'
import favIcon from '../assets/fav.png'
import CryptoCheckoutPanel from './CryptoCheckoutPanel'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { LANGUAGE_NAMES } from '../i18n/translations'
import './Header.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function getLocationKey() {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.hash}`
}

function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigate,
  cartItems = [],
  cartTotal = 0,
  onRemoveCartItem,
  solid = false,
}) {
  const { t, lang, setLang } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [bottomMoreOpen, setBottomMoreOpen] = useState(false)
  const [locationKey, setLocationKey] = useState(getLocationKey)
  const checkoutKey = `${cartItems.map((item) => item.id).join(',')}:${cartTotal}`

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const updateLocation = () => setLocationKey(getLocationKey())
    window.addEventListener('popstate', updateLocation)
    window.addEventListener('hashchange', updateLocation)
    return () => {
      window.removeEventListener('popstate', updateLocation)
      window.removeEventListener('hashchange', updateLocation)
    }
  }, [])

  useEffect(() => {
    if (!langOpen && !bottomMoreOpen) return undefined
    const close = () => {
      setLangOpen(false)
      setBottomMoreOpen(false)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [langOpen, bottomMoreOpen])

  const navigate = (event, href) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    event.preventDefault()
    onNavigate(href)
    const nextUrl = new URL(href, window.location.origin)
    setLocationKey(`${nextUrl.pathname}${nextUrl.hash}`)
    setBottomMoreOpen(false)
  }

  const currentPath = locationKey.split('#')[0] || '/'
  const currentHash = locationKey.includes('#') ? `#${locationKey.split('#')[1]}` : ''
  const moreHashes = new Set(['#game-info', '#characters', '#weapons', '#vehicles', '#social-media-guide', '#media', '#leonida'])

  const isActive = (target) => {
    if (target === 'main') return currentPath === '/' && !currentHash
    if (target === 'shop') return currentPath === '/shop'
    if (target === 'news') return currentPath === '/' && currentHash === '#news'
    if (target === 'community') return currentPath === '/community'
    if (target === 'more') return bottomMoreOpen || currentPath.startsWith('/locations/') || moreHashes.has(currentHash)
    return false
  }

  const bottomTabs = [
    { key: 'main', href: '/', label: t.nav.main || 'Main', icon: Home },
    { key: 'shop', href: '/shop', label: t.nav.shop || 'Shop', icon: Store },
    { key: 'news', href: '/#news', label: t.nav.news || 'News', icon: Newspaper },
    { key: 'community', href: '/community', label: t.nav.community || t.nav.social || 'Community', icon: UsersRound },
  ]

  const moreLinks = [
    { href: '/#game-info', label: t.nav.about, icon: Info },
    { href: '/#characters', label: t.nav.characters, icon: UserRoundSearch },
    { href: '/#leonida', label: t.nav.locations || 'Locations', icon: MapPinned },
    { href: '/#vehicles', label: t.nav.vehicles || 'Vehicles', icon: Car },
    { href: '/#weapons', label: t.nav.weapons || 'Weapons', icon: Crosshair },
    { href: '/#media', label: t.nav.media || 'Media', icon: Images },
    { href: '/#social-media-guide', label: t.nav.socialMedia || 'Social Media', icon: Radio },
  ]

  return (
    <>
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
          <a href="/shop" onClick={(event) => navigate(event, '/shop')}>
            {t.nav.shop || 'Shop'}
          </a>
          <a href="/community" onClick={(event) => navigate(event, '/community')}>
            {t.nav.community || t.nav.social || 'Community'}
          </a>
        </div>

        <div className="nav-auth">
          {cartItems.length > 0 && (
            <div className="nav-cart">
              <button type="button" className="nav-cart-toggle" aria-label={`${cartItems.length} cart items`}>
                <ShoppingCart size={16} />
                <span>{cartItems.length}</span>
              </button>
              <div className="nav-cart-popover">
                <CryptoCheckoutPanel
                  key={checkoutKey}
                  cartItems={cartItems}
                  cartTotal={cartTotal}
                  onRemoveItem={onRemoveCartItem}
                  compact
                />
              </div>
            </div>
          )}

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

      <nav className="bottom-tabs-navbar" aria-label="Primary navigation">
        {bottomTabs.map(({ key, href, label, icon: Icon }) => (
          <a
            key={key}
            className={`bottom-tab ${isActive(key) ? 'active' : ''}`}
            href={href}
            onClick={(event) => navigate(event, href)}
            aria-current={isActive(key) ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}

        <div className="bottom-more" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className={`bottom-tab bottom-more-toggle ${isActive('more') ? 'active' : ''}`}
            onClick={() => setBottomMoreOpen((open) => !open)}
            aria-label="Show more navigation links"
            aria-expanded={bottomMoreOpen}
            aria-haspopup="menu"
          >
            <Ellipsis size={20} aria-hidden="true" />
            <span>{t.nav.more || 'More'}</span>
          </button>

          <div className={`bottom-more-menu ${bottomMoreOpen ? 'open' : ''}`} role="menu">
            {moreLinks.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} role="menuitem" onClick={(event) => navigate(event, href)}>
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Header
