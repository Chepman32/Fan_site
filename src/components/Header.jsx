import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Car,
  Crosshair,
  Ellipsis,
  Globe,
  Handshake,
  Info,
  LogOut,
  MapPinned,
  Newspaper,
  Radio,
  ShoppingCart,
  Store,
  Settings as SettingsIcon,
  User,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { LANGUAGE_NAMES } from '../i18n/translations'
import QuickSettingsModal from './QuickSettingsModal'
import './Header.css'

const CryptoCheckoutPanel = lazy(() => import('./CryptoCheckoutPanel'))

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
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
  routePath = '/',
  settingsOpen = false,
}) {
  const { t, lang, setLang } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [bottomMoreOpen, setBottomMoreOpen] = useState(false)
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false)
  const checkoutKey = `${cartItems.map((item) => item.id).join(',')}:${cartTotal}`

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

  const closeHeaderMenus = () => {
    setLangOpen(false)
    setBottomMoreOpen(false)
    setQuickSettingsOpen(false)
  }

  const navigate = (event, href, options = {}) => {
    if (!onNavigate || !isPlainLeftClick(event)) return
    const { closeMenus = true, blurTarget = true, stopPropagation = false } = options

    event.preventDefault()
    if (stopPropagation) event.stopPropagation()
    onNavigate(href)
    if (closeMenus) closeHeaderMenus()
    if (blurTarget) event.currentTarget.blur()
  }

  const currentPath = routePath || '/'
  const isActive = (target) => {
    if (target === 'shop') return currentPath === '/shop' || currentPath.startsWith('/shop/')
    if (target === 'p2p') return currentPath === '/p2p' || currentPath.startsWith('/marketplace/')
    if (target === 'news') return currentPath === '/news' || currentPath.startsWith('/news/')
    if (target === 'community') return currentPath === '/community'
    if (target === 'profile') return currentPath === '/profile' || currentPath.startsWith('/profile/')
    if (target === 'settings') return quickSettingsOpen || settingsOpen || currentPath === '/settings'
    if (target === 'about') return currentPath === '/about' || currentPath === '/about-gta-vi'
    if (target === 'characters') return currentPath === '/characters' || currentPath === '/leonida/characters'
    if (target === 'locations') return currentPath === '/locations' || currentPath === '/leonida/locations' || currentPath.startsWith('/leonida/locations/') || currentPath.startsWith('/locations/')
    if (target === 'leonida') {
      return currentPath === '/leonida'
        || currentPath.startsWith('/leonida/')
        || currentPath.startsWith('/locations/')
    }
    if (target === 'vehicles') return currentPath === '/vehicles' || currentPath === '/leonida/vehicles'
    if (target === 'weapons') return currentPath === '/weapons' || currentPath === '/leonida/weapons'
    if (target === 'social-media') return currentPath === '/social-media' || currentPath === '/leonida/social-media'
    if (target === 'more') return bottomMoreOpen || currentPath === '/about' || currentPath === '/community'
    return false
  }

  const navLinkClass = (target, extraClass = '') => [
    extraClass,
    isActive(target) ? 'active' : '',
  ].filter(Boolean).join(' ')

  const ariaCurrent = (target) => (isActive(target) ? 'page' : undefined)

  const bottomTabs = [
    { key: 'shop', href: '/shop', label: t.nav.shop || 'Shop', icon: Store },
    { key: 'p2p', href: '/p2p', label: t.nav.p2pTrading || 'P2P Trading', icon: Handshake },
    { key: 'leonida', href: '/leonida', label: t.nav.leonida || 'Leonida', icon: MapPinned },
    { key: 'news', href: '/news', label: t.nav.news || 'News', icon: Newspaper },
  ]

  const moreLinks = [
    { key: 'about', href: '/about', label: t.nav.about, icon: Info },
    { key: 'characters', href: '/leonida/characters', label: t.nav.characters, icon: UserRoundSearch },
    { key: 'locations', href: '/leonida/locations', label: t.nav.locations || 'Locations', icon: MapPinned },
    { key: 'vehicles', href: '/leonida/vehicles', label: t.nav.vehicles || 'Vehicles', icon: Car },
    { key: 'weapons', href: '/leonida/weapons', label: t.nav.weapons || 'Weapons', icon: Crosshair },
    { key: 'community', href: '/community', label: t.nav.community || t.nav.social || 'Community', icon: UsersRound },
    { key: 'social-media', href: '/leonida/social-media', label: t.nav.socialMedia || 'Social Media', icon: Radio },
  ]

  return (
    <>
      <nav className={`navbar ${solid || scrolled ? 'scrolled' : ''}`} aria-label="Primary navigation">
        <a className="nav-brand" href="/" onClick={(event) => navigate(event, '/')}>
          <img className="nav-favicon" src="/favicon.svg" alt="" aria-hidden="true" width="32" height="32" />
          <span>GTA VI <span className="highlight">HUB</span></span>
        </a>

        <div className="nav-links">
          <a className={navLinkClass('shop')} href="/shop" onClick={(event) => navigate(event, '/shop')} aria-current={ariaCurrent('shop')}>{t.nav.shop || 'Shop'}</a>
          <a
            className={navLinkClass('p2p', 'nav-p2p-link')}
            href="/p2p"
            onClick={(event) => navigate(event, '/p2p')}
            aria-current={ariaCurrent('p2p')}
          >
            {t.nav.p2pTrading || 'P2P Trading'}
          </a>
          <a className={navLinkClass('leonida')} href="/leonida" onClick={(event) => navigate(event, '/leonida')} aria-current={ariaCurrent('leonida')}>{t.nav.leonida}</a>
          <a className={navLinkClass('news')} href="/news" onClick={(event) => navigate(event, '/news')} aria-current={ariaCurrent('news')}>{t.nav.news}</a>
          <a className={navLinkClass('about')} href="/about" onClick={(event) => navigate(event, '/about')} aria-current={ariaCurrent('about')}>{t.nav.about}</a>
          <a className={navLinkClass('community')} href="/community" onClick={(event) => navigate(event, '/community')} aria-current={ariaCurrent('community')}>
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
                <Suspense fallback={<div className="nav-cart-loading">Preparing checkout</div>}>
                  <CryptoCheckoutPanel
                    key={checkoutKey}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    onRemoveItem={onRemoveCartItem}
                    compact
                  />
                </Suspense>
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

          <button
            type="button"
            className={navLinkClass('settings', 'nav-settings-link')}
            onClick={(event) => {
              setLangOpen(false)
              setBottomMoreOpen(false)
              setQuickSettingsOpen((open) => !open)
              event.currentTarget.blur()
            }}
            aria-label={t.nav.settings || 'Settings'}
            aria-haspopup="dialog"
            aria-expanded={quickSettingsOpen}
          >
            <SettingsIcon size={16} aria-hidden="true" />
          </button>

          {currentUser ? (
            <>
              <a
                className={navLinkClass('profile', 'nav-profile')}
                href="/profile"
                onClick={(event) => navigate(event, '/profile')}
                aria-label="Open profile"
                aria-current={ariaCurrent('profile')}
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

      <nav className="bottom-tabs-navbar" aria-label="Mobile primary navigation">
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
            {moreLinks.map(({ key, href, label, icon: Icon }) => (
              <a
                key={href}
                className={navLinkClass(key)}
                href={href}
                role="menuitem"
                onClick={(event) => navigate(event, href)}
                aria-current={ariaCurrent(key)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {quickSettingsOpen && (
        <QuickSettingsModal
          onClose={() => setQuickSettingsOpen(false)}
          onOpenAuth={onOpenAuth}
        />
      )}
    </>
  )
}

export default Header
